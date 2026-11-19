import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../db/connection.ts';
import {
  AppError,
  PRODUCT_SELECT_BASE,
  buildSpecsSearchText,
  getMediaByProductIds,
  hydrateProductDetails,
  mapProductDetail,
  nowIso,
  type ProductDbRow,
} from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  LOADOUT_SLOT_TYPES,
  MISSION_TAGS,
  PLATFORM_TYPES,
  PROPULSION_TYPES,
  SHIPPING_CLASSES,
  type AdminDeleteProductResponse,
  type AdminProductDetailResponse,
  type AdminProductListResponse,
  type ProductCompatibility,
  type ProductMediaInput,
  type ProductSpecs,
} from '../../shared/types.ts';

export const adminProductsRouter = Router();

adminProductsRouter.use(requireAdminSession);

function isSafeMediaAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//') && (trimmed.startsWith('/media/') || trimmed.startsWith('/uploads/'));
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const mediaInputSchema = z.object({
  mediaType: z.enum(['image', 'video']),
  url: z
    .string()
    .trim()
    .min(1, 'URL media wajib diisi.')
    .max(300)
    .refine(
      isSafeMediaAssetUrl,
      'URL media harus diawali /media/, /uploads/, atau URL http(s) yang valid.',
    ),
  posterUrl: z
    .string()
    .trim()
    .max(300)
    .refine(
      (u) => u === '' || isSafeMediaAssetUrl(u),
      'URL poster harus diawali /media/, /uploads/, atau URL http(s) yang valid.',
    )
    .transform((u) => (u === '' ? null : u))
    .nullable()
    .optional(),
  altText: z.string().trim().default(''),
  durationSec: z.number().positive().nullable().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const productUpsertSchema = z.object({
  sku: z.string().trim().min(2, 'SKU minimal 2 karakter.').max(64),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug minimal 2 karakter.')
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.'),
  name: z.string().trim().min(2, 'Nama produk minimal 2 karakter.').max(200),
  brand: z.string().trim().min(1, 'Merek wajib diisi.').max(100),
  categoryId: z.number().int().positive('Kategori wajib dipilih.'),
  missionTags: z.array(z.enum(MISSION_TAGS)).default([]),
  platform: z.enum(PLATFORM_TYPES),
  propulsion: z.enum(PROPULSION_TYPES),
  loadoutSlot: z.enum(LOADOUT_SLOT_TYPES),
  priceIdr: z.number().int().min(0, 'Harga tidak boleh negatif.'),
  weightGrams: z.number().int().min(0, 'Berat tidak boleh negatif.'),
  initialStockQty: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).default(4),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  requiresAge18: z.boolean().default(false),
  shippingClass: z.enum(SHIPPING_CLASSES).default('REGULAR'),
  shortDescription: z.string().trim().max(500).default(''),
  description: z.string().trim().max(5000).default(''),
  specs: z.record(z.unknown()),
  compatibility: z.record(z.unknown()),
  media: z.array(mediaInputSchema).default([]),
});

const productMediaUpdateSchema = z.object({
  media: z.array(mediaInputSchema),
});

function parseProductId(raw: unknown): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_PRODUCT_ID', 'ID produk tidak valid.');
  }
  return id;
}

function getAdminProductDetailOrThrow(productId: number): AdminProductDetailResponse {
  const row = db
    .prepare(`${PRODUCT_SELECT_BASE} WHERE p.id = ? LIMIT 1`)
    .get(productId) as ProductDbRow | undefined;
  if (!row) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
  }
  const mediaMap = getMediaByProductIds([productId]);
  return {
    product: mapProductDetail(row, mediaMap.get(productId) ?? []),
  };
}

function normalizeSpecsAndCompatibility(
  data: z.infer<typeof productUpsertSchema>,
): {
  specs: ProductSpecs;
  compatibility: ProductCompatibility;
  fpsMin: number | null;
  fpsMax: number | null;
  energyJoule: number | null;
} {
  const rawSpecs = data.specs as Partial<ProductSpecs>;
  const fpsMin =
    typeof rawSpecs.fps_min === 'number' && Number.isFinite(rawSpecs.fps_min)
      ? Math.max(0, Math.round(rawSpecs.fps_min))
      : null;
  const fpsMax =
    typeof rawSpecs.fps_max === 'number' && Number.isFinite(rawSpecs.fps_max)
      ? Math.max(0, Math.round(rawSpecs.fps_max))
      : null;
  const energyJoule =
    typeof rawSpecs.energy_joule === 'number' && Number.isFinite(rawSpecs.energy_joule)
      ? Math.min(2.0, Math.max(0, Number(rawSpecs.energy_joule)))
      : null;

  const specs: ProductSpecs = {
    ...(rawSpecs as ProductSpecs),
    propulsion: data.propulsion,
    platform: data.platform,
    loadout_slot: data.loadoutSlot,
    fps_min: fpsMin,
    fps_max: fpsMax,
    energy_joule: energyJoule,
    connector: rawSpecs.connector ?? 'NONE',
    has_mosfet: rawSpecs.has_mosfet ?? null,
    muzzle_thread: rawSpecs.muzzle_thread ?? 'NONE',
    rail_type: Array.isArray(rawSpecs.rail_type) ? rawSpecs.rail_type : [],
    material: typeof rawSpecs.material === 'string' ? rawSpecs.material : '',
    cordura_denier: rawSpecs.cordura_denier ?? 'NONE',
  };

  const rawComp = data.compatibility as Partial<ProductCompatibility>;
  const compatibility: ProductCompatibility = {
    ...(rawComp as ProductCompatibility),
    loadout_slot: data.loadoutSlot,
    platform_family: data.platform,
    propulsion: data.propulsion,
  };

  return { specs, compatibility, fpsMin, fpsMax, energyJoule };
}

function replaceProductMedia(productId: number, mediaItems: ProductMediaInput[]): void {
  db.prepare('DELETE FROM product_media WHERE product_id = ?').run(productId);
  if (mediaItems.length === 0) {
    return;
  }

  const normalized = mediaItems.map((item, idx) => ({
    ...item,
    sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : idx,
  }));

  const hasPrimaryImage = normalized.some((m) => m.mediaType === 'image' && m.isPrimary);
  if (!hasPrimaryImage) {
    const firstImage = normalized.find((m) => m.mediaType === 'image');
    if (firstImage) {
      firstImage.isPrimary = true;
    }
  }

  const stmt = db.prepare(
    `INSERT INTO product_media (
      product_id, media_type, url, poster_url, alt_text, duration_sec, is_primary, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const item of normalized) {
    stmt.run(
      productId,
      item.mediaType,
      item.url,
      item.posterUrl ?? null,
      item.altText ?? '',
      item.durationSec ?? null,
      item.isPrimary ? 1 : 0,
      item.sortOrder,
    );
  }
}

adminProductsRouter.get('/', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
  const stockFilter =
    typeof req.query.stockFilter === 'string' ? req.query.stockFilter.trim() : 'all';
  const hasVideoParam = typeof req.query.hasVideo === 'string' ? req.query.hasVideo.trim() : '';

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push('(p.sku LIKE ? OR p.name LIKE ? OR p.brand LIKE ? OR p.slug LIKE ?)');
    params.push(like, like, like, like);
  }

  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }

  if (status === 'active') {
    conditions.push('p.is_active = 1 AND p.deleted_at IS NULL');
  } else if (status === 'inactive') {
    conditions.push('(p.is_active = 0 OR p.deleted_at IS NOT NULL)');
  }

  if (stockFilter === 'low') {
    conditions.push('p.stock_qty > 0 AND p.stock_qty <= p.low_stock_threshold');
  } else if (stockFilter === 'out') {
    conditions.push('p.stock_qty = 0');
  } else if (stockFilter === 'in') {
    conditions.push('p.stock_qty > p.low_stock_threshold');
  }

  if (hasVideoParam === '1' || hasVideoParam === 'true') {
    conditions.push(
      `EXISTS (SELECT 1 FROM product_media pm WHERE pm.product_id = p.id AND pm.media_type = 'video')`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`${PRODUCT_SELECT_BASE} ${whereClause} ORDER BY p.is_active DESC, p.id ASC`)
    .all(...params) as unknown as ProductDbRow[];

  const items = hydrateProductDetails(rows);
  const response: AdminProductListResponse = {
    items,
    total: items.length,
  };
  res.json(response);
});

adminProductsRouter.get('/:id', (req, res) => {
  const productId = parseProductId(req.params.id);
  res.json(getAdminProductDetailOrThrow(productId));
});

adminProductsRouter.post('/', (req, res) => {
  const parsed = productUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Periksa kembali formulir data produk Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  const normalizedSku = data.sku.toUpperCase();
  const initialStock = data.initialStockQty ?? 0;

  const created = withTransaction(() => {
    const catExists = db
      .prepare('SELECT id FROM categories WHERE id = ? LIMIT 1')
      .get(data.categoryId) as { id: number } | undefined;
    if (!catExists) {
      throw new AppError(400, 'INVALID_CATEGORY', 'Kategori produk tidak ditemukan.');
    }

    const dupSku = db
      .prepare('SELECT id FROM products WHERE UPPER(sku) = ? LIMIT 1')
      .get(normalizedSku) as { id: number } | undefined;
    if (dupSku) {
      throw new AppError(409, 'DUPLICATE_SKU', `SKU ${normalizedSku} sudah digunakan produk lain.`);
    }

    const dupSlug = db
      .prepare('SELECT id FROM products WHERE slug = ? LIMIT 1')
      .get(data.slug) as { id: number } | undefined;
    if (dupSlug) {
      throw new AppError(409, 'DUPLICATE_SLUG', `Slug ${data.slug} sudah digunakan produk lain.`);
    }

    const { specs, compatibility, fpsMin, fpsMax, energyJoule } =
      normalizeSpecsAndCompatibility(data);
    const specsSearchText = buildSpecsSearchText(specs, compatibility, data.missionTags);
    const timestamp = nowIso();

    const insertRes = db
      .prepare(
        `INSERT INTO products (
          sku, slug, name, brand, category_id, mission_tags_json,
          platform, propulsion, loadout_slot, price_idr, weight_grams,
          fps_min, fps_max, energy_joule, stock_qty, low_stock_threshold,
          is_featured, is_active, requires_age_18, shipping_class,
          short_description, description, specs_json, compatibility_tags_json,
          specs_search_text, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      )
      .run(
        normalizedSku,
        data.slug,
        data.name,
        data.brand,
        data.categoryId,
        JSON.stringify(data.missionTags),
        data.platform,
        data.propulsion,
        data.loadoutSlot,
        data.priceIdr,
        data.weightGrams,
        fpsMin,
        fpsMax,
        energyJoule,
        initialStock,
        data.lowStockThreshold,
        data.isFeatured ? 1 : 0,
        data.isActive ? 1 : 0,
        data.requiresAge18 ? 1 : 0,
        data.shippingClass,
        data.shortDescription,
        data.description,
        JSON.stringify(specs),
        JSON.stringify(compatibility),
        specsSearchText,
        timestamp,
        timestamp,
      );

    const productId = Number(insertRes.lastInsertRowid);
    replaceProductMedia(productId, data.media);

    if (initialStock > 0) {
      db.prepare(
        `INSERT INTO inventory_mutations (
          product_id, delta_qty, stock_before, stock_after, reason, reference_id, note, actor, created_at
        ) VALUES (?, ?, 0, ?, 'MANUAL_RESTOCK', ?, ?, ?, ?)`,
      ).run(
        productId,
        initialStock,
        initialStock,
        `CREATE-${normalizedSku}`,
        `Stok awal saat penambahan produk baru ${normalizedSku}`,
        req.admin!.username,
        timestamp,
      );
    }

    return getAdminProductDetailOrThrow(productId);
  });

  res.status(201).json(created);
});

adminProductsRouter.put('/:id', (req, res) => {
  const productId = parseProductId(req.params.id);
  const parsed = productUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Periksa kembali formulir pembaruan produk Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  const normalizedSku = data.sku.toUpperCase();

  const updated = withTransaction(() => {
    const existing = db
      .prepare('SELECT id FROM products WHERE id = ? LIMIT 1')
      .get(productId) as { id: number } | undefined;
    if (!existing) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
    }

    const catExists = db
      .prepare('SELECT id FROM categories WHERE id = ? LIMIT 1')
      .get(data.categoryId) as { id: number } | undefined;
    if (!catExists) {
      throw new AppError(400, 'INVALID_CATEGORY', 'Kategori produk tidak ditemukan.');
    }

    const dupSku = db
      .prepare('SELECT id FROM products WHERE UPPER(sku) = ? AND id != ? LIMIT 1')
      .get(normalizedSku, productId) as { id: number } | undefined;
    if (dupSku) {
      throw new AppError(409, 'DUPLICATE_SKU', `SKU ${normalizedSku} sudah digunakan produk lain.`);
    }

    const dupSlug = db
      .prepare('SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1')
      .get(data.slug, productId) as { id: number } | undefined;
    if (dupSlug) {
      throw new AppError(409, 'DUPLICATE_SLUG', `Slug ${data.slug} sudah digunakan produk lain.`);
    }

    const { specs, compatibility, fpsMin, fpsMax, energyJoule } =
      normalizeSpecsAndCompatibility(data);
    const specsSearchText = buildSpecsSearchText(specs, compatibility, data.missionTags);
    const timestamp = nowIso();

    db.prepare(
      `UPDATE products SET
        sku = ?,
        slug = ?,
        name = ?,
        brand = ?,
        category_id = ?,
        mission_tags_json = ?,
        platform = ?,
        propulsion = ?,
        loadout_slot = ?,
        price_idr = ?,
        weight_grams = ?,
        fps_min = ?,
        fps_max = ?,
        energy_joule = ?,
        low_stock_threshold = ?,
        is_featured = ?,
        is_active = ?,
        requires_age_18 = ?,
        shipping_class = ?,
        short_description = ?,
        description = ?,
        specs_json = ?,
        compatibility_tags_json = ?,
        specs_search_text = ?,
        deleted_at = CASE WHEN ? = 1 THEN NULL ELSE deleted_at END,
        updated_at = ?
       WHERE id = ?`,
    ).run(
      normalizedSku,
      data.slug,
      data.name,
      data.brand,
      data.categoryId,
      JSON.stringify(data.missionTags),
      data.platform,
      data.propulsion,
      data.loadoutSlot,
      data.priceIdr,
      data.weightGrams,
      fpsMin,
      fpsMax,
      energyJoule,
      data.lowStockThreshold,
      data.isFeatured ? 1 : 0,
      data.isActive ? 1 : 0,
      data.requiresAge18 ? 1 : 0,
      data.shippingClass,
      data.shortDescription,
      data.description,
      JSON.stringify(specs),
      JSON.stringify(compatibility),
      specsSearchText,
      data.isActive ? 1 : 0,
      timestamp,
      productId,
    );

    replaceProductMedia(productId, data.media);
    return getAdminProductDetailOrThrow(productId);
  });

  res.json(updated);
});

adminProductsRouter.put('/:id/media', (req, res) => {
  const productId = parseProductId(req.params.id);
  const parsed = productMediaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Daftar media produk tidak valid.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const updated = withTransaction(() => {
    const existing = db
      .prepare('SELECT id FROM products WHERE id = ? LIMIT 1')
      .get(productId) as { id: number } | undefined;
    if (!existing) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
    }

    replaceProductMedia(productId, parsed.data.media);
    db.prepare('UPDATE products SET updated_at = ? WHERE id = ?').run(nowIso(), productId);
    return getAdminProductDetailOrThrow(productId);
  });

  res.json(updated);
});

adminProductsRouter.delete('/:id', (req, res) => {
  const productId = parseProductId(req.params.id);

  const response: AdminDeleteProductResponse = withTransaction(() => {
    const existing = db
      .prepare('SELECT id, sku, name FROM products WHERE id = ? LIMIT 1')
      .get(productId) as { id: number; sku: string; name: string } | undefined;
    if (!existing) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
    }

    const orderRef = db
      .prepare('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1')
      .get(productId);
    const mutationRef = db
      .prepare('SELECT 1 FROM inventory_mutations WHERE product_id = ? LIMIT 1')
      .get(productId);

    if (orderRef || mutationRef) {
      const timestamp = nowIso();
      db.prepare(
        'UPDATE products SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?',
      ).run(timestamp, timestamp, productId);
      return {
        ok: true,
        id: productId,
        mode: 'soft_archived',
        message: `Produk ${existing.sku} diarsipkan secara aman karena sudah memiliki riwayat transaksi atau ledger inventori.`,
      };
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return {
      ok: true,
      id: productId,
      mode: 'hard_deleted',
      message: `Produk ${existing.sku} berhasil dihapus permanen.`,
    };
  });

  res.json(response);
});
