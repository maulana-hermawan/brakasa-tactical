import fs from 'node:fs';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  DIST_CLIENT_DIR,
  PORT,
  PUBLIC_MEDIA_DIR,
  UPLOADS_DIR,
} from './config.ts';
import { seedDatabase } from './db/seed.ts';
import { AppError, sendError } from './db/helpers.ts';
import { htmlShellMiddleware } from './middleware/htmlShell.ts';
import { publicRouter } from './routes/public.ts';
import { ordersRouter } from './routes/orders.ts';
import { adminAuthRouter } from './routes/adminAuth.ts';
import { adminDashboardRouter } from './routes/adminDashboard.ts';
import { adminProductsRouter } from './routes/adminProducts.ts';
import { adminMediaRouter } from './routes/adminMedia.ts';
import { adminInventoryRouter } from './routes/adminInventory.ts';
import { adminOrdersRouter } from './routes/adminOrders.ts';
import { adminVouchersRouter } from './routes/adminVouchers.ts';
import { adminSettingsRouter } from './routes/adminSettings.ts';

seedDatabase();

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '2mb' }));

app.use(
  '/media',
  express.static(PUBLIC_MEDIA_DIR, {
    acceptRanges: true,
    etag: true,
    maxAge: '1d',
  }),
  (_req, res) => {
    sendError(res, 404, 'MEDIA_NOT_FOUND', 'Berkas media tidak ditemukan.');
  },
);

app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    acceptRanges: true,
    etag: true,
    maxAge: '1h',
  }),
  (_req, res) => {
    sendError(res, 404, 'UPLOAD_NOT_FOUND', 'Berkas unggahan tidak ditemukan.');
  },
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'brakasa-tactical', timestamp: new Date().toISOString() });
});

app.use('/api/orders', ordersRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/admin/inventory', adminInventoryRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/vouchers', adminVouchersRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api', publicRouter);

app.use('/api', (_req, res) => {
  sendError(res, 404, 'API_NOT_FOUND', 'Endpoint API yang diminta tidak ditemukan.');
});

if (fs.existsSync(DIST_CLIENT_DIR)) {
  app.use(
    express.static(DIST_CLIENT_DIR, {
      index: false,
      maxAge: '7d',
    }),
  );
}

app.use(htmlShellMiddleware);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message, err.details);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'INVALID_JSON', 'Format body JSON permintaan tidak valid.');
    return;
  }

  const sqliteMessage = err instanceof Error ? err.message : '';
  if (sqliteMessage.includes('UNIQUE constraint failed')) {
    sendError(res, 409, 'CONFLICT', 'Data unik sudah terdaftar di basis data.');
    return;
  }

  console.error('[brakasa-server] Unhandled error:', err);
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    'Terjadi gangguan pada server saat memproses permintaan Anda.',
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[brakasa-server] Ready on http://127.0.0.1:${PORT}`);
});
