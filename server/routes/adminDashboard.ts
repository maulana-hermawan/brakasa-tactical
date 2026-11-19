import { Router } from 'express';
import { db } from '../db/connection.ts';
import {
  computeStockStatus,
  mapInventoryMutation,
  mapOrderSummary,
  nowIso,
  type InventoryMutationDbRow,
  type OrderDbRow,
} from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  ORDER_STATUSES,
  type AdminDashboardResponse,
  type AdminLowStockItem,
  type OrderStatus,
} from '../../shared/types.ts';

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAdminSession);

adminDashboardRouter.get('/', (_req, res) => {
  const orderAgg = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN status IN ('PAID_VERIFIED', 'PACKED', 'SHIPPED', 'COMPLETED') THEN total_idr ELSE 0 END), 0) AS confirmed_revenue_idr,
        COALESCE(SUM(CASE WHEN status = 'PENDING_PAYMENT' THEN total_idr ELSE 0 END), 0) AS pending_payment_revenue_idr,
        COALESCE(SUM(CASE WHEN status IN ('PENDING_PAYMENT', 'PAID_VERIFIED', 'PACKED') THEN 1 ELSE 0 END), 0) AS action_required_orders_count,
        COUNT(*) AS total_orders_count
       FROM orders`,
    )
    .get() as {
    confirmed_revenue_idr: number;
    pending_payment_revenue_idr: number;
    action_required_orders_count: number;
    total_orders_count: number;
  };

  const productAgg = db
    .prepare(
      `SELECT
        COUNT(*) AS active_sku_count,
        COALESCE(SUM(CASE WHEN stock_qty > 0 AND stock_qty <= low_stock_threshold THEN 1 ELSE 0 END), 0) AS low_stock_sku_count,
        COALESCE(SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_sku_count,
        COALESCE(SUM(stock_qty * price_idr), 0) AS total_inventory_value_idr,
        COALESCE(SUM(CASE WHEN EXISTS (
          SELECT 1 FROM product_media pm WHERE pm.product_id = products.id AND pm.media_type = 'video'
        ) THEN 1 ELSE 0 END), 0) AS products_with_video_count
       FROM products
       WHERE is_active = 1 AND deleted_at IS NULL`,
    )
    .get() as {
    active_sku_count: number;
    low_stock_sku_count: number;
    out_of_stock_sku_count: number;
    total_inventory_value_idr: number;
    products_with_video_count: number;
  };

  const breakdownRows = db
    .prepare('SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status')
    .all() as Array<{ status: string; cnt: number }>;

  const orderStatusBreakdown = ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );
  for (const row of breakdownRows) {
    if (row.status in orderStatusBreakdown) {
      orderStatusBreakdown[row.status as OrderStatus] = Number(row.cnt);
    }
  }

  const priorityOrderRows = db
    .prepare(
      `SELECT
        o.*,
        COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS item_count
       FROM orders o
       WHERE o.status IN ('PENDING_PAYMENT', 'PAID_VERIFIED', 'PACKED')
       ORDER BY
         CASE o.status
           WHEN 'PENDING_PAYMENT' THEN 1
           WHEN 'PAID_VERIFIED' THEN 2
           WHEN 'PACKED' THEN 3
           ELSE 4
         END ASC,
         o.created_at ASC
       LIMIT 10`,
    )
    .all() as unknown as OrderDbRow[];

  const lowStockRows = db
    .prepare(
      `SELECT
        p.id, p.sku, p.slug, p.name, c.name AS category_name,
        p.stock_qty, p.low_stock_threshold, p.price_idr
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
         AND p.deleted_at IS NULL
         AND p.stock_qty <= p.low_stock_threshold
       ORDER BY p.stock_qty ASC, p.id ASC`,
    )
    .all() as Array<{
    id: number;
    sku: string;
    slug: string;
    name: string;
    category_name: string;
    stock_qty: number;
    low_stock_threshold: number;
    price_idr: number;
  }>;

  const lowStockProducts: AdminLowStockItem[] = lowStockRows.map((row) => ({
    id: Number(row.id),
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    categoryName: row.category_name,
    stockQty: Number(row.stock_qty),
    lowStockThreshold: Number(row.low_stock_threshold),
    stockStatus: computeStockStatus(Number(row.stock_qty), Number(row.low_stock_threshold)),
    priceIdr: Number(row.price_idr),
  }));

  const mutationRows = db
    .prepare(
      `SELECT
        m.id, m.product_id, p.sku AS product_sku, p.name AS product_name,
        m.delta_qty, m.stock_before, m.stock_after, m.reason,
        m.reference_id, m.note, m.actor, m.created_at
       FROM inventory_mutations m
       JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 10`,
    )
    .all() as unknown as InventoryMutationDbRow[];

  const response: AdminDashboardResponse = {
    generatedAt: nowIso(),
    kpis: {
      confirmedRevenueIdr: Number(orderAgg?.confirmed_revenue_idr ?? 0),
      pendingPaymentRevenueIdr: Number(orderAgg?.pending_payment_revenue_idr ?? 0),
      actionRequiredOrdersCount: Number(orderAgg?.action_required_orders_count ?? 0),
      lowStockSkuCount: Number(productAgg?.low_stock_sku_count ?? 0),
      outOfStockSkuCount: Number(productAgg?.out_of_stock_sku_count ?? 0),
      activeSkuCount: Number(productAgg?.active_sku_count ?? 0),
      productsWithVideoCount: Number(productAgg?.products_with_video_count ?? 0),
      totalInventoryValueIdr: Number(productAgg?.total_inventory_value_idr ?? 0),
      totalOrdersCount: Number(orderAgg?.total_orders_count ?? 0),
    },
    orderStatusBreakdown,
    priorityOrders: priorityOrderRows.map((row) => mapOrderSummary(row)),
    lowStockProducts,
    recentMutations: mutationRows.map(mapInventoryMutation),
  };

  res.json(response);
});
