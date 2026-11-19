import { Router } from 'express';
import { z } from 'zod';
import { db, withTransaction } from '../db/connection.ts';
import { AppError, getSiteSettingsBundle, nowIso } from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  SHIPPING_CLASSES,
  SHIPPING_COURIERS,
  SHIPPING_ZONES,
  type AdminSettingsResponse,
} from '../../shared/types.ts';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdminSession);

function isSafeNavigationOrAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const safeUrlSchema = (maxLen: number) =>
  z
    .string()
    .trim()
    .min(1, 'URL wajib diisi.')
    .max(maxLen)
    .refine(
      isSafeNavigationOrAssetUrl,
      'URL harus berupa path relatif diawali / (bukan //) atau URL http(s) yang aman.',
    );

const safeHttpsUrlOptionalSchema = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .refine(
      (val) => val === '' || isSafeHttpsUrl(val),
      'URL Maps harus menggunakan protokol https:// yang aman.',
    )
    .optional();

const armoryProfileSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(240).optional(),
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(100),
  whatsappNumber: z.string().trim().min(4).max(40),
  supportEmail: z.string().trim().email().max(160),
  operatingHours: z.string().trim().min(1).max(160),
  operatingHoursEn: z.string().trim().max(160).optional(),
  mapsEmbedUrl: safeHttpsUrlOptionalSchema(600),
  mapsDirectionsUrl: safeHttpsUrlOptionalSchema(600),
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().trim().max(400).optional(),
  complianceNoticeShort: z.string().trim().max(400).optional(),
});

const heroSlideSchema = z.object({
  id: z.string().trim().min(1).max(60),
  imageUrl: safeUrlSchema(300),
  altId: z.string().trim().max(240).default(''),
  altEn: z.string().trim().max(240).default(''),
  headlineId: z.string().trim().min(1).max(120),
  headlineEn: z.string().trim().min(1).max(120),
  ctaLabelId: z.string().trim().min(1).max(80),
  ctaLabelEn: z.string().trim().min(1).max(80),
  ctaUrl: safeUrlSchema(200),
  sortOrder: z.number().int().min(0).max(50).default(0),
});

const heroConfigSchema = z.object({
  videoUrl: safeUrlSchema(300),
  posterUrl: safeUrlSchema(300),
  durationSec: z.number().positive().max(30),
  headline: z.string().trim().min(2).max(200),
  subheadline: z.string().trim().max(500),
  primaryCtaLabel: z.string().trim().min(1).max(80),
  primaryCtaUrl: safeUrlSchema(200),
  secondaryCtaLabel: z.string().trim().min(1).max(80),
  secondaryCtaUrl: safeUrlSchema(200),
  cacheVersion: z.string().trim().default('1'),
});

const heroSceneSchema = z.object({
  index: z.number().int().min(1).max(20),
  code: z.string().trim().min(1).max(24),
  title: z.string().trim().min(1).max(100),
  startSec: z.number().min(0).max(30),
  endSec: z.number().positive().max(30),
  keyframeUrl: safeUrlSchema(300),
  telemetryMeta: z.string().trim().max(160),
  platformTag: z.string().trim().max(60),
  targetUrl: safeUrlSchema(200),
  targetLabel: z.string().trim().min(1).max(80),
});

const spotlightConfigSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(400),
  imageUrl: safeUrlSchema(300),
  imageAlt: z.string().trim().max(240),
  presetKey: z.string().trim().min(1).max(80),
  hotspots: z.array(
    z.object({
      id: z.string().trim().min(1).max(60),
      code: z.string().trim().min(1).max(24),
      label: z.string().trim().min(1).max(100),
      xPercent: z.number().min(0).max(100),
      yPercent: z.number().min(0).max(100),
      productSku: z.string().trim().min(2).max(64),
    }),
  ),
});

const shippingSettingsSchema = z.object({
  woodenPackingFeeIdr: z.number().int().min(0),
  couriers: z.array(
    z.object({
      code: z.enum(SHIPPING_COURIERS),
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(300),
      etaDays: z.string().trim().min(1).max(80),
      allowedClasses: z.array(z.enum(SHIPPING_CLASSES)),
      baseMultiplier: z.number().min(0),
      minChargeableKg: z.number().int().min(0),
      isPickup: z.boolean(),
    }),
  ),
  zoneRates: z.array(
    z.object({
      zone: z.enum(SHIPPING_ZONES),
      label: z.string().trim().min(1).max(100),
      regularPerKgIdr: z.number().int().min(0),
      cargoPerKgIdr: z.number().int().min(0),
      hazmatSurchargeIdr: z.number().int().min(0),
    }),
  ),
});

const inventoryDefaultsSchema = z.object({
  defaultLowStockThreshold: z.number().int().min(0).max(1000),
});

const settingsUpdateSchema = z.object({
  armoryProfile: armoryProfileSchema.optional(),
  heroSlides: z.array(heroSlideSchema).min(1).max(8).optional(),
  heroConfig: heroConfigSchema.optional(),
  heroScenes: z.array(heroSceneSchema).min(1).max(20).optional(),
  spotlightConfig: spotlightConfigSchema.optional(),
  shippingSettings: shippingSettingsSchema.optional(),
  inventoryDefaults: inventoryDefaultsSchema.optional(),
});

adminSettingsRouter.get('/', (_req, res) => {
  const response: AdminSettingsResponse = getSiteSettingsBundle();
  res.json(response);
});

adminSettingsRouter.put('/', (req, res) => {
  const parsed = settingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Periksa kembali format konfigurasi pengaturan yang dikirim.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const payload = parsed.data;
  const currentBundle = getSiteSettingsBundle().settings;
  const timestamp = nowIso();

  withTransaction(() => {
    const upsertStmt = db.prepare(
      `INSERT INTO site_settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
    );

    if (payload.armoryProfile) {
      const nextProfile = {
        ...currentBundle.armoryProfile,
        ...payload.armoryProfile,
        tagline: payload.armoryProfile.tagline ?? currentBundle.armoryProfile.tagline,
        operatingHoursEn:
          payload.armoryProfile.operatingHoursEn !== undefined
            ? payload.armoryProfile.operatingHoursEn
            : currentBundle.armoryProfile.operatingHoursEn,
        mapsEmbedUrl:
          payload.armoryProfile.mapsEmbedUrl !== undefined
            ? payload.armoryProfile.mapsEmbedUrl || undefined
            : currentBundle.armoryProfile.mapsEmbedUrl,
        mapsDirectionsUrl:
          payload.armoryProfile.mapsDirectionsUrl !== undefined
            ? payload.armoryProfile.mapsDirectionsUrl || undefined
            : currentBundle.armoryProfile.mapsDirectionsUrl,
        announcementEnabled: payload.armoryProfile.announcementEnabled ?? false,
        announcementText: payload.armoryProfile.announcementText ?? '',
        complianceNoticeShort: payload.armoryProfile.complianceNoticeShort ?? '',
      };
      upsertStmt.run('armory_profile', JSON.stringify(nextProfile), timestamp);
    }

    if (payload.heroSlides) {
      const sortedSlides = [...payload.heroSlides]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((slide, idx) => ({
          ...slide,
          altId: slide.altId || slide.headlineId,
          altEn: slide.altEn || slide.headlineEn,
          sortOrder: idx + 1,
        }));
      upsertStmt.run('hero_slides', JSON.stringify(sortedSlides), timestamp);
    }

    if (payload.heroConfig) {
      const heroChanged =
        payload.heroConfig.videoUrl !== currentBundle.heroConfig?.videoUrl ||
        payload.heroConfig.posterUrl !== currentBundle.heroConfig?.posterUrl;
      const nextHero = {
        ...payload.heroConfig,
        cacheVersion: heroChanged
          ? String(Date.now())
          : payload.heroConfig.cacheVersion || currentBundle.heroConfig?.cacheVersion || '2',
      };
      upsertStmt.run('hero_config', JSON.stringify(nextHero), timestamp);
    }

    if (payload.heroScenes) {
      const sortedScenes = [...payload.heroScenes]
        .sort((a, b) => a.startSec - b.startSec)
        .map((scene, idx) => ({ ...scene, index: idx + 1 }));
      upsertStmt.run('hero_scenes', JSON.stringify(sortedScenes), timestamp);
    }

    if (payload.spotlightConfig) {
      upsertStmt.run('spotlight_config', JSON.stringify(payload.spotlightConfig), timestamp);
    }

    if (payload.shippingSettings) {
      upsertStmt.run('shipping_settings', JSON.stringify(payload.shippingSettings), timestamp);
    }

    if (payload.inventoryDefaults) {
      upsertStmt.run('inventory_defaults', JSON.stringify(payload.inventoryDefaults), timestamp);
    }
  });

  const updated: AdminSettingsResponse = getSiteSettingsBundle();
  res.json(updated);
});
