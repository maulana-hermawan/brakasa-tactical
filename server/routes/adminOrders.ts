import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.ts';
import { AppError, mapOrderSummary, type OrderDbRow } from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  fetchOrderDetailById,
  fetchOrderTimeline,
  updateAdminOrderStatus,
} from '../services/orderService.ts';
import {
  ALLOWED_ORDER_TRANSITIONS,
  ORDER_STATUSES,
  SHIPPING_COURIERS,
  type AdminOrderDetailResponse,
  type AdminOrderListResponse,
  type OrderStatus,
} from '../../shared/types.ts';

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAdminSession);

const statusUpdateSchema = z.object({
  nextStatus: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(100).optional(),
  shippingCourier: z.enum(SHIPPING_COURIERS).optional(),
  note: z.string().trim().max(500).optional(),
  cancelReason: z.string().trim().max(500).optional(),
});

function parseOrderId(raw: unknown): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_ORDER_ID', 'ID pesanan tidak valid.');
  }
  return id;
}

adminOrdersRouter.get('/', (req, res) => {
  const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : 'ALL';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const countsByStatus = ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  const countRows = db
    .prepare('SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status')
    .all() as Array<{ status: string; cnt: number }>;
  for (const row of countRows) {
    if (row.status in countsByStatus) {
      countsByStatus[row.status as OrderStatus] = Number(row.cnt);
    }
  }

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (statusParam && statusParam !== 'ALL' && (ORDER_STATUSES as readonly string[]).includes(statusParam)) {
    conditions.push('o.status = ?');
    params.push(statusParam);
  }

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      `(o.invoice_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ? OR COALESCE(o.tracking_number, '') LIKE ?)`,
    );
    params.push(like, like, like, like, like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT
        o.*,
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS item_count
       FROM orders o
       ${whereClause}
       ORDER BY o.created_at DESC, o.id DESC`,
    )
    .all(...params) as unknown as OrderDbRow[];

  const orders = rows.map((row) => mapOrderSummary(row));
  const response: AdminOrderListResponse = {
    orders,
    countsByStatus,
    total: orders.length,
  };
  res.json(response);
});

adminOrdersRouter.get('/:id', (req, res) => {
  const orderId = parseOrderId(req.params.id);
  const order = fetchOrderDetailById(orderId);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
  }
  const timeline = fetchOrderTimeline(orderId);
  const allowedNextStatuses = [...(ALLOWED_ORDER_TRANSITIONS[order.status] ?? [])];

  const response: AdminOrderDetailResponse = {
    order,
    timeline,
    allowedNextStatuses,
  };
  res.json(response);
});

adminOrdersRouter.patch('/:id/status', (req, res) => {
  const orderId = parseOrderId(req.params.id);
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Payload pembaruan status pesanan tidak valid.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const result = updateAdminOrderStatus(orderId, parsed.data, req.admin!.username);
  res.json(result);
});
