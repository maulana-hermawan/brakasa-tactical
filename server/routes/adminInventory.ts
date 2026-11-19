import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../db/connection.ts';
import {
  AppError,
  computeStockStatus,
  mapInventoryMutation,
  nowIso,
  type InventoryMutationDbRow,
} from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  INVENTORY_MUTATION_REASONS,
  type AdminInventoryAdjustResponse,
  type AdminInventoryListResponse,
  type AdminInventoryProductRow,
} from '../../shared/types.ts';

export const adminInventoryRouter = Router();

adminInventoryRouter.use(requireAdminSession);

const adjustSchema = z.object({
  productId: z.number().int().positive('Produk wajib dipilih.'),
  deltaQty: z
    .number()
    .int('Perubahan stok harus bilangan bulat.')
    .refine((val) => val !== 0, 'Jumlah penyesuaian stok tidak boleh nol.'),
  reason: z.enum(['MANUAL_RESTOCK', 'AUDIT_ADJUSTMENT']),
  referenceId: z.string().trim().max(80).optional(),
  note: z.string().trim().min(3, 'Tuliskan catatan alasan penyesuaian stok (minimal 3 karakter).').max(300),
});

interface InventoryProductDbRow {
  id: number;
  sku: string;
  name: string;
  category_name: string;
  price_idr: number;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: number;
  last_mutation_at: string | null;
}

function mapInventoryProductRow(row: InventoryProductDbRow): AdminInventoryProductRow {
  const stockQty = Number(row.stock_qty);
  const lowStockThreshold = Number(row.low_stock_threshold);
  const priceIdr = Number(row.price_idr);
  return {
    id: Number(row.id),
    sku: row.sku,
    name: row.name,
    categoryName: row.category_name,
    priceIdr,
    stockQty,
    lowStockThreshold,
    stockStatus: computeStockStatus(stockQty, lowStockThreshold),
    inventoryValueIdr: stockQty * priceIdr,
    isActive: Number(row.is_active) === 1,
    lastMutationAt: row.last_mutation_at,
  };
}

adminInventoryRouter.get('/', (req, res) => {
  const productIdRaw =
    typeof req.query.productId === 'string' && req.query.productId.trim() !== ''
      ? Number(req.query.productId)
      : undefined;
  const reason = typeof req.query.reason === 'string' ? req.query.reason.trim() : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const productConditions = ['p.deleted_at IS NULL'];
  const productParams: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    productConditions.push('(p.sku LIKE ? OR p.name LIKE ? OR c.name LIKE ?)');
    productParams.push(like, like, like);
  }

  const productRows = db
    .prepare(
      `SELECT
        p.id, p.sku, p.name, c.name AS category_name,
        p.price_idr, p.stock_qty, p.low_stock_threshold, p.is_active,
        (SELECT MAX(m.created_at) FROM inventory_mutations m WHERE m.product_id = p.id) AS last_mutation_at
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${productConditions.join(' AND ')}
       ORDER BY (p.stock_qty <= p.low_stock_threshold) DESC, p.stock_qty ASC, p.id ASC`,
    )
    .all(...productParams) as unknown as InventoryProductDbRow[];

  const totalValueRow = db
    .prepare(
      `SELECT COALESCE(SUM(stock_qty * price_idr), 0) AS total_value
       FROM products
       WHERE is_active = 1 AND deleted_at IS NULL`,
    )
    .get() as { total_value: number };

  const mutationConditions: string[] = [];
  const mutationParams: Array<string | number> = [];

  if (productIdRaw && Number.isInteger(productIdRaw) && productIdRaw > 0) {
    mutationConditions.push('m.product_id = ?');
    mutationParams.push(productIdRaw);
  }

  if (reason && (INVENTORY_MUTATION_REASONS as readonly string[]).includes(reason)) {
    mutationConditions.push('m.reason = ?');
    mutationParams.push(reason);
  }

  if (q) {
    const like = `%${q}%`;
    mutationConditions.push(
      '(p.sku LIKE ? OR p.name LIKE ? OR m.note LIKE ? OR COALESCE(m.reference_id, \'\') LIKE ?)',
    );
    mutationParams.push(like, like, like, like);
  }

  const mutationWhere =
    mutationConditions.length > 0 ? `WHERE ${mutationConditions.join(' AND ')}` : '';

  const mutationRows = db
    .prepare(
      `SELECT
        m.id, m.product_id, p.sku AS product_sku, p.name AS product_name,
        m.delta_qty, m.stock_before, m.stock_after, m.reason,
        m.reference_id, m.note, m.actor, m.created_at
       FROM inventory_mutations m
       JOIN products p ON p.id = m.product_id
       ${mutationWhere}
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 100`,
    )
    .all(...mutationParams) as unknown as InventoryMutationDbRow[];

  const response: AdminInventoryListResponse = {
    products: productRows.map(mapInventoryProductRow),
    mutations: mutationRows.map(mapInventoryMutation),
    totalInventoryValueIdr: Number(totalValueRow?.total_value ?? 0),
  };

  res.json(response);
});

adminInventoryRouter.post('/adjust', (req, res) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Data penyesuaian stok tidak valid.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const { productId, deltaQty, reason, referenceId, note } = parsed.data;
  const actor = req.admin!.username;

  const result: AdminInventoryAdjustResponse = withTransaction(() => {
    const existing = db
      .prepare(
        `SELECT p.id, p.sku, p.name, c.name AS category_name,
                p.price_idr, p.stock_qty, p.low_stock_threshold, p.is_active
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.id = ?
         LIMIT 1`,
      )
      .get(productId) as Omit<InventoryProductDbRow, 'last_mutation_at'> | undefined;

    if (!existing) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
    }

    const stockBefore = Number(existing.stock_qty);
    const stockAfter = stockBefore + deltaQty;
    if (stockAfter < 0) {
      throw new AppError(
        409,
        'NEGATIVE_STOCK_NOT_ALLOWED',
        `Penyesuaian ditolak: stok saat ini ${stockBefore} unit, tidak dapat dikurangi sebanyak ${Math.abs(deltaQty)} unit.`,
      );
    }

    const timestamp = nowIso();

    db.prepare('UPDATE products SET stock_qty = ?, updated_at = ? WHERE id = ?').run(
      stockAfter,
      timestamp,
      productId,
    );

    const inserted = db
      .prepare(
        `INSERT INTO inventory_mutations (
          product_id, delta_qty, stock_before, stock_after, reason, reference_id, note, actor, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        productId,
        deltaQty,
        stockBefore,
        stockAfter,
        reason,
        referenceId && referenceId.length > 0 ? referenceId : null,
        note,
        actor,
        timestamp,
      );

    const mutationId = Number(inserted.lastInsertRowid);
    const mutationRow = db
      .prepare(
        `SELECT
          m.id, m.product_id, p.sku AS product_sku, p.name AS product_name,
          m.delta_qty, m.stock_before, m.stock_after, m.reason,
          m.reference_id, m.note, m.actor, m.created_at
         FROM inventory_mutations m
         JOIN products p ON p.id = m.product_id
         WHERE m.id = ?
         LIMIT 1`,
      )
      .get(mutationId) as unknown as InventoryMutationDbRow;

    const updatedProduct = mapInventoryProductRow({
      ...existing,
      stock_qty: stockAfter,
      last_mutation_at: timestamp,
    });

    return {
      product: updatedProduct,
      mutation: mapInventoryMutation(mutationRow),
    };
  });

  res.json(result);
});
