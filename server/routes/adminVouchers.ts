import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.ts';
import {
  AppError,
  mapVoucherRow,
  nowIso,
  type VoucherDbRow,
} from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import type {
  AdminDeleteVoucherResponse,
  AdminVoucherListResponse,
} from '../../shared/types.ts';

export const adminVouchersRouter = Router();

adminVouchersRouter.use(requireAdminSession);

const voucherCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Kode voucher minimal 3 karakter.')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Kode voucher hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung.'),
    description: z.string().trim().max(300).default(''),
    discountType: z.enum(['PERCENT', 'FIXED']),
    discountValue: z.number().int().positive('Nilai diskon harus lebih besar dari 0.'),
    maxDiscountIdr: z.number().int().positive().nullable().optional(),
    minSubtotalIdr: z.number().int().min(0).default(0),
    maxUses: z.number().int().positive().nullable().optional(),
    startsAt: z.string().trim().nullable().optional(),
    expiresAt: z.string().trim().nullable().optional(),
    isPublic: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => !(data.discountType === 'PERCENT' && data.discountValue > 100),
    { message: 'Persentase diskon tidak boleh melebihi 100%.', path: ['discountValue'] },
  );

const voucherUpdateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Kode voucher minimal 3 karakter.')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Kode voucher hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung.')
      .optional(),
    description: z.string().trim().max(300).optional(),
    discountType: z.enum(['PERCENT', 'FIXED']).optional(),
    discountValue: z.number().int().positive('Nilai diskon harus lebih besar dari 0.').optional(),
    maxDiscountIdr: z.number().int().positive().nullable().optional(),
    minSubtotalIdr: z.number().int().min(0).optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    startsAt: z.string().trim().nullable().optional(),
    expiresAt: z.string().trim().nullable().optional(),
    isPublic: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !(
        data.discountType === 'PERCENT' &&
        data.discountValue !== undefined &&
        data.discountValue > 100
      ),
    { message: 'Persentase diskon tidak boleh melebihi 100%.', path: ['discountValue'] },
  );

function parseVoucherId(raw: unknown): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_VOUCHER_ID', 'ID voucher tidak valid.');
  }
  return id;
}

adminVouchersRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM vouchers ORDER BY is_active DESC, created_at DESC, id DESC')
    .all() as unknown as VoucherDbRow[];
  const response: AdminVoucherListResponse = {
    vouchers: rows.map(mapVoucherRow),
  };
  res.json(response);
});

adminVouchersRouter.post('/', (req, res) => {
  const parsed = voucherCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Periksa kembali data formulir voucher Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  const code = data.code.toUpperCase();

  const existing = db
    .prepare('SELECT id FROM vouchers WHERE code = ? COLLATE NOCASE LIMIT 1')
    .get(code) as { id: number } | undefined;
  if (existing) {
    throw new AppError(409, 'DUPLICATE_VOUCHER_CODE', `Kode voucher ${code} sudah terdaftar.`);
  }

  const timestamp = nowIso();
  const inserted = db
    .prepare(
      `INSERT INTO vouchers (
        code, description, discount_type, discount_value, max_discount_idr,
        min_subtotal_idr, max_uses, used_count, starts_at, expires_at,
        is_public, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      code,
      data.description,
      data.discountType,
      data.discountValue,
      data.maxDiscountIdr ?? null,
      data.minSubtotalIdr,
      data.maxUses ?? null,
      data.startsAt && data.startsAt.length > 0 ? data.startsAt : null,
      data.expiresAt && data.expiresAt.length > 0 ? data.expiresAt : null,
      data.isPublic ? 1 : 0,
      data.isActive ? 1 : 0,
      timestamp,
      timestamp,
    );

  const createdRow = db
    .prepare('SELECT * FROM vouchers WHERE id = ? LIMIT 1')
    .get(Number(inserted.lastInsertRowid)) as unknown as VoucherDbRow;

  res.status(201).json(mapVoucherRow(createdRow));
});

adminVouchersRouter.patch('/:id', (req, res) => {
  const voucherId = parseVoucherId(req.params.id);
  const parsed = voucherUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Data pembaruan voucher tidak valid.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const existingRow = db
    .prepare('SELECT * FROM vouchers WHERE id = ? LIMIT 1')
    .get(voucherId) as VoucherDbRow | undefined;
  if (!existingRow) {
    throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher tidak ditemukan.');
  }

  const data = parsed.data;
  const nextCode = data.code ? data.code.toUpperCase() : existingRow.code;

  if (nextCode.toLowerCase() !== existingRow.code.toLowerCase()) {
    const dup = db
      .prepare('SELECT id FROM vouchers WHERE code = ? COLLATE NOCASE AND id != ? LIMIT 1')
      .get(nextCode, voucherId) as { id: number } | undefined;
    if (dup) {
      throw new AppError(409, 'DUPLICATE_VOUCHER_CODE', `Kode voucher ${nextCode} sudah terdaftar.`);
    }
  }

  const nextDiscountType = data.discountType ?? existingRow.discount_type;
  const nextDiscountValue = data.discountValue ?? Number(existingRow.discount_value);
  if (nextDiscountType === 'PERCENT' && nextDiscountValue > 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Persentase diskon tidak boleh melebihi 100%.');
  }

  const nextStartsAt =
    data.startsAt !== undefined
      ? data.startsAt && data.startsAt.length > 0
        ? data.startsAt
        : null
      : existingRow.starts_at;
  const nextExpiresAt =
    data.expiresAt !== undefined
      ? data.expiresAt && data.expiresAt.length > 0
        ? data.expiresAt
        : null
      : existingRow.expires_at;

  db.prepare(
    `UPDATE vouchers SET
      code = ?,
      description = ?,
      discount_type = ?,
      discount_value = ?,
      max_discount_idr = ?,
      min_subtotal_idr = ?,
      max_uses = ?,
      starts_at = ?,
      expires_at = ?,
      is_public = ?,
      is_active = ?,
      updated_at = ?
     WHERE id = ?`,
  ).run(
    nextCode,
    data.description ?? existingRow.description,
    nextDiscountType,
    nextDiscountValue,
    data.maxDiscountIdr !== undefined ? data.maxDiscountIdr : existingRow.max_discount_idr,
    data.minSubtotalIdr ?? Number(existingRow.min_subtotal_idr),
    data.maxUses !== undefined ? data.maxUses : existingRow.max_uses,
    nextStartsAt,
    nextExpiresAt,
    data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : Number(existingRow.is_public),
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : Number(existingRow.is_active),
    nowIso(),
    voucherId,
  );

  const updatedRow = db
    .prepare('SELECT * FROM vouchers WHERE id = ? LIMIT 1')
    .get(voucherId) as unknown as VoucherDbRow;
  res.json(mapVoucherRow(updatedRow));
});

adminVouchersRouter.delete('/:id', (req, res) => {
  const voucherId = parseVoucherId(req.params.id);
  const existingRow = db
    .prepare('SELECT id, code, used_count FROM vouchers WHERE id = ? LIMIT 1')
    .get(voucherId) as { id: number; code: string; used_count: number } | undefined;

  if (!existingRow) {
    throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher tidak ditemukan.');
  }

  if (Number(existingRow.used_count) > 0) {
    throw new AppError(
      409,
      'VOUCHER_IN_USE',
      `Voucher ${existingRow.code} sudah digunakan pada ${existingRow.used_count} transaksi dan tidak dapat dihapus permanen. Nonaktifkan voucher jika ingin menghentikan promo.`,
    );
  }

  db.prepare('DELETE FROM vouchers WHERE id = ?').run(voucherId);
  const response: AdminDeleteVoucherResponse = { ok: true, id: voucherId };
  res.json(response);
});
