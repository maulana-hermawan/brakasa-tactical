import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../db/helpers.ts';
import { createAtomicOrder } from '../services/orderService.ts';
import {
  PAYMENT_METHODS,
  SHIPPING_COURIERS,
  SHIPPING_ZONES,
} from '../../shared/types.ts';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, 'Keranjang pesanan minimal berisi satu produk.'),
  customerName: z.string().trim().min(2, 'Nama lengkap minimal 2 karakter.').max(120),
  customerEmail: z.string().trim().email('Format email tidak valid.').max(160),
  customerPhone: z
    .string()
    .trim()
    .min(9, 'Nomor WhatsApp/HP minimal 9 karakter.')
    .max(25)
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 9 && digits.length <= 16;
    }, 'Nomor WhatsApp/HP harus berisi 9 sampai 16 digit angka.'),
  shippingZone: z.enum(SHIPPING_ZONES),
  shippingCity: z.string().trim().min(2, 'Kota atau kabupaten wajib diisi.').max(100),
  shippingDistrict: z.string().trim().max(100).default(''),
  shippingPostalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Kode pos harus terdiri dari 5 digit angka.')
    .or(z.literal(''))
    .default(''),
  shippingAddress: z.string().trim().min(8, 'Alamat pengiriman lengkap minimal 8 karakter.').max(400),
  shippingNotes: z.string().trim().max(300).optional(),
  shippingCourier: z.enum(SHIPPING_COURIERS),
  woodenPacking: z.boolean().default(false),
  paymentMethod: z.enum(PAYMENT_METHODS),
  voucherCode: z.string().trim().max(40).nullable().optional(),
});

ordersRouter.post('/', (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Periksa kembali kelengkapan data checkout Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const created = createAtomicOrder(parsed.data);
  res.status(201).json(created);
});
