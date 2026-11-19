import fs from 'node:fs';
import type { NextFunction, Request, Response } from 'express';
import { DEV_INDEX_HTML_PATH, PROD_INDEX_HTML_PATH } from '../config.ts';
import { db } from '../db/connection.ts';
import { DEFAULT_HERO_SLIDES, getSettingValue } from '../db/helpers.ts';
import type { HeroSlideConfig } from '../../shared/types.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadHtmlTemplate(): string {
  if (fs.existsSync(PROD_INDEX_HTML_PATH)) {
    return fs.readFileSync(PROD_INDEX_HTML_PATH, 'utf-8');
  }
  return fs.readFileSync(DEV_INDEX_HTML_PATH, 'utf-8');
}

interface RouteMeta {
  title: string;
  description: string;
  isHome: boolean;
}

function resolveRouteMeta(pathname: string): RouteMeta {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'Brakasa Tactical | Airsoft & Tactical Gear',
      description:
        'Katalog airsoft, optik, plate carrier, helm, dan perlengkapan taktis pilihan di Brakasa Tactical.',
      isHome: true,
    };
  }

  if (pathname === '/store' || pathname === '/store/') {
    return {
      title: 'Katalog | Brakasa Tactical',
      description:
        'Jelajahi katalog unit airsoft, optik, plate carrier, helm, dan perlengkapan taktis Brakasa Tactical.',
      isHome: false,
    };
  }

  if (pathname.startsWith('/store/')) {
    const rawSegment = pathname.slice('/store/'.length).split('/')[0] ?? '';
    let slug = '';
    try {
      slug = decodeURIComponent(rawSegment).trim();
    } catch {
      slug = '';
    }
    if (slug) {
      const product = db
        .prepare(
          `SELECT name, short_description FROM products
           WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL
           LIMIT 1`,
        )
        .get(slug) as { name: string; short_description: string } | undefined;

      if (product) {
        return {
          title: `${product.name} | Brakasa Tactical`,
          description:
            product.short_description ||
            `Spesifikasi teknis dan ketersediaan stok ${product.name} di Brakasa Tactical.`,
          isHome: false,
        };
      }
    }
    return {
      title: 'Katalog | Brakasa Tactical',
      description: 'Spesifikasi teknis produk dan katalog resmi Brakasa Tactical.',
      isHome: false,
    };
  }

  if (pathname === '/checkout' || pathname === '/checkout/') {
    return {
      title: 'Checkout | Brakasa Tactical',
      description:
        'Selesaikan pesanan pengiriman dan pembayaran Anda di Brakasa Tactical.',
      isHome: false,
    };
  }

  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    return {
      title: 'Login Admin | Brakasa Tactical',
      description: 'Halaman masuk admin Brakasa Tactical.',
      isHome: false,
    };
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return {
      title: 'Admin Panel | Brakasa Tactical',
      description: 'Panel operasional pesanan, inventori, katalog, voucher, dan pengaturan Brakasa Tactical.',
      isHome: false,
    };
  }

  return {
    title: 'Halaman Tidak Ditemukan | Brakasa Tactical',
    description: 'Tautan yang Anda buka tidak tersedia di Brakasa Tactical.',
    isHome: false,
  };
}

export function renderHtmlShell(req: Request, templateHtml: string): string {
  const pathname = req.path || '/';
  const meta = resolveRouteMeta(pathname);

  const rawSlides = getSettingValue<HeroSlideConfig[]>('hero_slides', DEFAULT_HERO_SLIDES);
  const heroSlides =
    Array.isArray(rawSlides) && rawSlides.length > 0
      ? [...rawSlides].sort((a, b) => a.sortOrder - b.sortOrder)
      : DEFAULT_HERO_SLIDES;

  const firstSlide = heroSlides[0];
  const posterUrl = firstSlide?.imageUrl || '/media/images/hero/hero-scene-01.jpg';
  const posterAlt = firstSlide?.altId || 'Brakasa Tactical unit airsoft presisi dan meja kerja armory';
  const escapedPosterUrl = escapeHtml(posterUrl);
  const escapedPosterAlt = escapeHtml(posterAlt);

  const preloadLink = meta.isHome
    ? `\n    <link rel="preload" as="image" href="${escapedPosterUrl}" fetchpriority="high" />`
    : '';

  const headMetaHtml = `<title>${escapeHtml(meta.title)}</title>\n    <meta name="description" content="${escapeHtml(meta.description)}" />${preloadLink}`;

  const lcpShellHtml = meta.isHome
    ? `<div id="hero-lcp-shell" style="position:relative;width:100%;height:100dvh;min-height:540px;max-height:1080px;background:#0F1110;overflow:hidden;"><img id="hero-lcp-poster" src="${escapedPosterUrl}" width="2400" height="1350" fetchpriority="high" decoding="sync" alt="${escapedPosterAlt}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;" /></div>`
    : '';

  return templateHtml
    .replace('<!--BRAKASA_HEAD_META-->', headMetaHtml)
    .replace('<!--BRAKASA_LCP_PRELOAD_SHELL-->', lcpShellHtml);
}

export function htmlShellMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const pathname = req.path || '/';
  if (
    pathname.startsWith('/api/') ||
    pathname === '/api' ||
    pathname.startsWith('/media/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/assets/')
  ) {
    next();
    return;
  }

  try {
    const templateHtml = loadHtmlTemplate();
    const rendered = renderHtmlShell(req, templateHtml);
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(rendered);
  } catch (err) {
    next(err);
  }
}
