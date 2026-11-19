import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.ts';
import {
  AppError,
  CATEGORY_IMAGE_MAP,
  PRODUCT_SELECT_BASE,
  getMediaByProductIds,
  getSiteSettingsBundle,
  hydrateProductSummaries,
  mapProductDetail,
  mapVoucherRow,
  sanitizeFtsQuery,
  type ProductDbRow,
  type VoucherDbRow,
} from '../db/helpers.ts';
import { evaluateVoucher } from '../services/orderService.ts';
import type {
  BootstrapResponse,
  CategoryWithCount,
  LoadoutSpotlightHotspotResolved,
  MissionSummary,
  MissionTag,
  PlatformType,
  ProductDetailResponse,
  ProductFilterFacets,
  ProductListResponse,
  ProductSortOption,
  ProductSummary,
  PropulsionType,
  PublicVoucherPromo,
} from '../../shared/types.ts';

export const publicRouter = Router();

const MISSION_CATALOG_META: Array<{
  mission: MissionTag;
  title: string;
  subtitle: string;
  fpsProfile: string;
  medGuideline: string;
  targetUrl: string;
}> = [
  {
    mission: 'cqb',
    title: 'CQB Indoor Breacher',
    subtitle: 'Unit kompak ber-respons pelatuk cepat dengan profil <= 350 FPS dan proteksi jarak dekat.',
    fpsProfile: '<= 350 FPS @ 0.20g (<= 1,14 J)',
    medGuideline: 'MED 0 - 3 meter',
    targetUrl: '/store?mission=cqb&maxFps=350',
  },
  {
    mission: 'woodland-recce',
    title: 'Woodland Recce & Marksman',
    subtitle: 'Carbine, AK-74M, dan bolt-action sniper dengan LPVO untuk jangkauan lapangan terbuka.',
    fpsProfile: '370 - 445 FPS @ 0.20g (1,35 - 1,90 J)',
    medGuideline: 'MED 10 - 25 meter (Sidearm direkomendasikan)',
    targetUrl: '/store?mission=woodland-recce',
  },
  {
    mission: 'speedqb',
    title: 'SpeedQB & Kompak',
    subtitle: 'Platform ringan berbasis ETU/MOSFET, chest rig cepat, dan tracer unit 14mm CCW.',
    fpsProfile: '300 - 350 FPS @ 0.20g (0,90 - 1,10 J)',
    medGuideline: 'MED 0 - 3 meter',
    targetUrl: '/store?mission=speedqb&maxFps=350',
  },
  {
    mission: 'rig-protection',
    title: 'Rig, Helm & Proteksi Lapangan',
    subtitle: 'Plate carrier Cordura 500D, placard SwiftClip, helm ARC rail, headset aktif, dan apparel NyCo.',
    fpsProfile: 'Non-Replica (Cordura 500D & NRR 22 dB)',
    medGuideline: 'Distribusi beban & proteksi benturan',
    targetUrl: '/store?mission=rig-protection',
  },
];

function parseBoolParam(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const lower = value.trim().toLowerCase();
  return lower === '1' || lower === 'true' || lower === 'yes';
}

function parseNumberParam(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

publicRouter.get('/bootstrap', (_req, res) => {
  const categoryRows = db
    .prepare(
      `SELECT
        c.id, c.slug, c.name, c.description, c.sort_order,
        COUNT(p.id) AS active_product_count
       FROM categories c
       LEFT JOIN products p
         ON p.category_id = c.id AND p.is_active = 1 AND p.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`,
    )
    .all() as Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    sort_order: number;
    active_product_count: number;
  }>;

  const { settings } = getSiteSettingsBundle();

  const activeRows = db
    .prepare(
      `${PRODUCT_SELECT_BASE}
       WHERE p.is_active = 1 AND p.deleted_at IS NULL
       ORDER BY p.is_featured DESC, p.id ASC`,
    )
    .all() as unknown as ProductDbRow[];

  const allActiveSummaries = hydrateProductSummaries(activeRows);
  const firstImageByCategorySlug = new Map<string, string>();
  for (const product of allActiveSummaries) {
    if (!firstImageByCategorySlug.has(product.categorySlug) && product.primaryImageUrl) {
      firstImageByCategorySlug.set(product.categorySlug, product.primaryImageUrl);
    }
  }

  const categories: CategoryWithCount[] = categoryRows.map((c) => ({
    id: Number(c.id),
    slug: c.slug,
    name: c.name,
    description: c.description,
    sortOrder: Number(c.sort_order),
    activeProductCount: Number(c.active_product_count),
    imageUrl:
      CATEGORY_IMAGE_MAP[c.slug] ??
      firstImageByCategorySlug.get(c.slug) ??
      '/media/images/products/brk-ar-001.jpg',
  }));

  const featuredProducts = allActiveSummaries
    .filter((product) => product.isFeatured)
    .slice(0, 8);

  const bySku = new Map<string, ProductSummary>(
    allActiveSummaries.map((p) => [p.sku.toUpperCase(), p]),
  );

  const spotlightConfig = settings.spotlightConfig;
  const resolvedHotspots: LoadoutSpotlightHotspotResolved[] = (spotlightConfig?.hotspots ?? []).map(
    (hs) => ({
      ...hs,
      product: bySku.get(hs.productSku.toUpperCase()) ?? null,
    }),
  );

  const spotlightProductsUnique = new Map<number, ProductSummary>();
  for (const hs of resolvedHotspots) {
    if (hs.product) {
      spotlightProductsUnique.set(hs.product.id, hs.product);
    }
  }
  const spotlightTotalPrice = Array.from(spotlightProductsUnique.values()).reduce(
    (sum, p) => sum + p.priceIdr,
    0,
  );
  const spotlightTotalWeight = Array.from(spotlightProductsUnique.values()).reduce(
    (sum, p) => sum + p.weightGrams,
    0,
  );

  const nowIsoStr = new Date().toISOString();
  const voucherRows = db
    .prepare(
      `SELECT * FROM vouchers
       WHERE is_active = 1
         AND is_public = 1
         AND (starts_at IS NULL OR starts_at <= ?)
         AND (expires_at IS NULL OR expires_at >= ?)
         AND (max_uses IS NULL OR used_count < max_uses)
       ORDER BY min_subtotal_idr ASC, id ASC`,
    )
    .all(nowIsoStr, nowIsoStr) as unknown as VoucherDbRow[];

  const activePromos: PublicVoucherPromo[] = voucherRows.map((row) => {
    const v = mapVoucherRow(row);
    return {
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountIdr: v.maxDiscountIdr,
      minSubtotalIdr: v.minSubtotalIdr,
      expiresAt: v.expiresAt,
    };
  });

  const missionStmt = db.prepare(
    `SELECT
      COUNT(DISTINCT p.id) AS cnt,
      MIN(p.price_idr) AS min_price,
      MAX(p.price_idr) AS max_price
     FROM products p, json_each(p.mission_tags_json) je
     WHERE p.is_active = 1 AND p.deleted_at IS NULL AND je.value = ?`,
  );

  const missionSummaries: MissionSummary[] = MISSION_CATALOG_META.map((meta) => {
    const agg = missionStmt.get(meta.mission) as
      | { cnt: number; min_price: number | null; max_price: number | null }
      | undefined;
    return {
      ...meta,
      activeProductCount: Number(agg?.cnt ?? 0),
      minPriceIdr: agg?.min_price !== null && agg?.min_price !== undefined ? Number(agg.min_price) : null,
      maxPriceIdr: agg?.max_price !== null && agg?.max_price !== undefined ? Number(agg.max_price) : null,
    };
  });

  const fieldVideoProducts = allActiveSummaries.filter((p) => p.hasVideo);
  const sortedHeroSlides = [...settings.heroSlides].sort((a, b) => a.sortOrder - b.sortOrder);

  const response: BootstrapResponse = {
    categories,
    featuredProducts,
    settings: {
      armoryProfile: settings.armoryProfile,
      heroSlides: sortedHeroSlides,
      heroConfig: settings.heroConfig,
      heroScenes: settings.heroScenes,
      ...(spotlightConfig
        ? {
            spotlight: {
              title: spotlightConfig.title,
              subtitle: spotlightConfig.subtitle,
              imageUrl: spotlightConfig.imageUrl,
              imageAlt: spotlightConfig.imageAlt,
              presetKey: spotlightConfig.presetKey,
              hotspots: resolvedHotspots,
              totalPriceIdr: spotlightTotalPrice,
              totalWeightGrams: spotlightTotalWeight,
            },
          }
        : {}),
      shippingSettings: settings.shippingSettings,
    },
    activePromos,
    missionSummaries,
    fieldVideoProducts,
    loadoutPresets: [],
  };

  res.json(response);
});

publicRouter.get('/products', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const mission = typeof req.query.mission === 'string' ? req.query.mission.trim() : '';
  const platform = typeof req.query.platform === 'string' ? req.query.platform.trim() : '';
  const propulsion = typeof req.query.propulsion === 'string' ? req.query.propulsion.trim() : '';
  const loadoutSlot =
    typeof req.query.loadoutSlot === 'string' ? req.query.loadoutSlot.trim() : '';
  const minPrice = parseNumberParam(req.query.minPrice);
  const maxPrice = parseNumberParam(req.query.maxPrice);
  const minFps = parseNumberParam(req.query.minFps);
  const maxFps = parseNumberParam(req.query.maxFps);
  const inStock = parseBoolParam(req.query.inStock);
  const lowStock = parseBoolParam(req.query.lowStock);
  const hasVideo = parseBoolParam(req.query.hasVideo);
  const featured = parseBoolParam(req.query.featured);
  const idsRaw = typeof req.query.ids === 'string' ? req.query.ids.trim() : '';
  const sort = (typeof req.query.sort === 'string' ? req.query.sort.trim() : 'featured') as ProductSortOption;

  const page = Math.max(1, Math.floor(parseNumberParam(req.query.page) ?? 1));
  const requestedLimit = Math.floor(parseNumberParam(req.query.limit) ?? 24);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['p.is_active = 1', 'p.deleted_at IS NULL'];
  const params: Array<string | number> = [];

  if (idsRaw) {
    const idList = idsRaw
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((num) => Number.isInteger(num) && num > 0);
    if (idList.length === 0) {
      const emptyFacets = computeActiveProductFacets();
      const emptyRes: ProductListResponse = {
        items: [],
        total: 0,
        page,
        limit,
        facets: emptyFacets,
      };
      res.json(emptyRes);
      return;
    }
    conditions.push(`p.id IN (${idList.map(() => '?').join(',')})`);
    params.push(...idList);
  }

  if (q) {
    const ftsQuery = sanitizeFtsQuery(q);
    if (ftsQuery) {
      conditions.push(`p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?)`);
      params.push(ftsQuery);
    } else {
      const likeTerm = `%${q}%`;
      conditions.push(
        `(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.short_description LIKE ? OR p.specs_search_text LIKE ?)`,
      );
      params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
    }
  }

  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }

  if (mission) {
    conditions.push(
      `EXISTS (SELECT 1 FROM json_each(p.mission_tags_json) je WHERE je.value = ?)`,
    );
    params.push(mission);
  }

  if (platform) {
    conditions.push('p.platform = ?');
    params.push(platform);
  }

  if (propulsion) {
    conditions.push('p.propulsion = ?');
    params.push(propulsion);
  }

  if (loadoutSlot) {
    conditions.push('p.loadout_slot = ?');
    params.push(loadoutSlot);
  }

  if (minPrice !== undefined) {
    conditions.push('p.price_idr >= ?');
    params.push(minPrice);
  }

  if (maxPrice !== undefined) {
    conditions.push('p.price_idr <= ?');
    params.push(maxPrice);
  }

  if (minFps !== undefined) {
    conditions.push('p.fps_max IS NOT NULL AND p.fps_max >= ?');
    params.push(minFps);
  }

  if (maxFps !== undefined) {
    conditions.push('p.fps_min IS NOT NULL AND p.fps_min <= ?');
    params.push(maxFps);
  }

  if (inStock) {
    conditions.push('p.stock_qty > 0');
  }

  if (lowStock) {
    conditions.push('p.stock_qty > 0 AND p.stock_qty <= p.low_stock_threshold');
  }

  if (hasVideo) {
    conditions.push(
      `EXISTS (SELECT 1 FROM product_media pm WHERE pm.product_id = p.id AND pm.media_type = 'video')`,
    );
  }

  if (featured) {
    conditions.push('p.is_featured = 1');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderBy = 'ORDER BY p.is_featured DESC, p.id ASC';
  switch (sort) {
    case 'newest':
      orderBy = 'ORDER BY p.created_at DESC, p.id DESC';
      break;
    case 'price_asc':
      orderBy = 'ORDER BY p.price_idr ASC, p.id ASC';
      break;
    case 'price_desc':
      orderBy = 'ORDER BY p.price_idr DESC, p.id ASC';
      break;
    case 'fps_asc':
      orderBy = 'ORDER BY (p.fps_max IS NULL) ASC, p.fps_max ASC, p.id ASC';
      break;
    case 'fps_desc':
      orderBy = 'ORDER BY (p.fps_max IS NULL) ASC, p.fps_max DESC, p.id ASC';
      break;
    case 'featured':
    default:
      orderBy = 'ORDER BY p.is_featured DESC, p.id ASC';
      break;
  }

  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}`,
    )
    .get(...params) as { total: number };

  const total = Number(countRow?.total ?? 0);

  const rows = db
    .prepare(
      `${PRODUCT_SELECT_BASE}
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as ProductDbRow[];

  const items = hydrateProductSummaries(rows);
  const facets = computeActiveProductFacets();

  const response: ProductListResponse = {
    items,
    total,
    page,
    limit,
    facets,
  };
  res.json(response);
});

function computeActiveProductFacets(): ProductFilterFacets {
  const catRows = db
    .prepare(
      `SELECT c.slug, c.name, COUNT(p.id) AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 AND p.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`,
    )
    .all() as Array<{ slug: string; name: string; count: number }>;

  const platformRows = db
    .prepare(
      `SELECT platform AS value, COUNT(*) AS count
       FROM products
       WHERE is_active = 1 AND deleted_at IS NULL
       GROUP BY platform
       ORDER BY count DESC, platform ASC`,
    )
    .all() as Array<{ value: string; count: number }>;

  const propulsionRows = db
    .prepare(
      `SELECT propulsion AS value, COUNT(*) AS count
       FROM products
       WHERE is_active = 1 AND deleted_at IS NULL
       GROUP BY propulsion
       ORDER BY count DESC, propulsion ASC`,
    )
    .all() as Array<{ value: string; count: number }>;

  const rangeRow = db
    .prepare(
      `SELECT
        COALESCE(MIN(price_idr), 0) AS min_price,
        COALESCE(MAX(price_idr), 0) AS max_price,
        COALESCE(MIN(fps_min), 0) AS min_fps,
        COALESCE(MAX(fps_max), 0) AS max_fps,
        SUM(CASE WHEN stock_qty > 0 THEN 1 ELSE 0 END) AS in_stock_count,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM product_media pm WHERE pm.product_id = products.id AND pm.media_type = 'video'
        ) THEN 1 ELSE 0 END) AS with_video_count
       FROM products
       WHERE is_active = 1 AND deleted_at IS NULL`,
    )
    .get() as {
    min_price: number;
    max_price: number;
    min_fps: number;
    max_fps: number;
    in_stock_count: number | null;
    with_video_count: number | null;
  };

  return {
    categories: catRows.map((r) => ({
      slug: r.slug,
      name: r.name,
      count: Number(r.count),
    })),
    platforms: platformRows.map((r) => ({
      value: r.value as PlatformType,
      count: Number(r.count),
    })),
    propulsions: propulsionRows.map((r) => ({
      value: r.value as PropulsionType,
      count: Number(r.count),
    })),
    priceRange: {
      minIdr: Number(rangeRow?.min_price ?? 0),
      maxIdr: Number(rangeRow?.max_price ?? 0),
    },
    fpsRange: {
      minFps: Number(rangeRow?.min_fps ?? 0),
      maxFps: Number(rangeRow?.max_fps ?? 0),
    },
    withVideoCount: Number(rangeRow?.with_video_count ?? 0),
    inStockCount: Number(rangeRow?.in_stock_count ?? 0),
  };
}

publicRouter.get('/products/:slug', (req, res) => {
  const slug = String(req.params.slug ?? '').trim();
  const row = db
    .prepare(
      `${PRODUCT_SELECT_BASE}
       WHERE p.slug = ? AND p.is_active = 1 AND p.deleted_at IS NULL
       LIMIT 1`,
    )
    .get(slug) as ProductDbRow | undefined;

  if (!row) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan di katalog aktif.');
  }

  const mediaMap = getMediaByProductIds([Number(row.id)]);
  const product = mapProductDetail(row, mediaMap.get(Number(row.id)) ?? []);

  const compatibleSkus = (product.compatibility.compatible_skus ?? []).map((s) => s.toUpperCase());
  const compatibleProducts: ProductSummary[] = [];

  if (compatibleSkus.length > 0) {
    const placeholders = compatibleSkus.map(() => '?').join(',');
    const explicitRows = db
      .prepare(
        `${PRODUCT_SELECT_BASE}
         WHERE p.is_active = 1
           AND p.deleted_at IS NULL
           AND p.stock_qty > 0
           AND p.id != ?
           AND UPPER(p.sku) IN (${placeholders})
         LIMIT 4`,
      )
      .all(product.id, ...compatibleSkus) as unknown as ProductDbRow[];

    const hydratedExplicit = hydrateProductSummaries(explicitRows);
    const rankMap = new Map(compatibleSkus.map((sku, idx) => [sku, idx]));
    hydratedExplicit.sort(
      (a, b) => (rankMap.get(a.sku.toUpperCase()) ?? 99) - (rankMap.get(b.sku.toUpperCase()) ?? 99),
    );
    compatibleProducts.push(...hydratedExplicit);
  }

  if (compatibleProducts.length < 4) {
    const excludeIds = [product.id, ...compatibleProducts.map((p) => p.id)];
    const excludePlaceholders = excludeIds.map(() => '?').join(',');
    const remainingLimit = 4 - compatibleProducts.length;
    const fallbackRows = db
      .prepare(
        `${PRODUCT_SELECT_BASE}
         WHERE p.is_active = 1
           AND p.deleted_at IS NULL
           AND p.stock_qty > 0
           AND p.id NOT IN (${excludePlaceholders})
         ORDER BY (p.loadout_slot != ?) DESC, p.is_featured DESC, p.id ASC
         LIMIT ?`,
      )
      .all(...excludeIds, product.loadoutSlot, remainingLimit) as unknown as ProductDbRow[];
    compatibleProducts.push(...hydrateProductSummaries(fallbackRows));
  }

  const response: ProductDetailResponse = {
    product,
    compatibleProducts: compatibleProducts.slice(0, 4),
  };
  res.json(response);
});

const voucherValidateSchema = z.object({
  code: z.string(),
  subtotalIdr: z.number().nonnegative(),
  shippingCostIdr: z.number().nonnegative().optional(),
});

publicRouter.post('/vouchers/validate', (req, res) => {
  const parsed = voucherValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Masukkan kode voucher dan nilai subtotal yang valid.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const { voucherId: _ignored, ...result } = evaluateVoucher(
    parsed.data.code,
    parsed.data.subtotalIdr,
    parsed.data.shippingCostIdr,
  );
  res.json(result);
});
