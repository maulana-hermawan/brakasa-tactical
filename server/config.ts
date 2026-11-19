import path from 'node:path';

const isDevFlag = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

export const ROOT_DIR = process.cwd();
export const PORT = process.env.PORT ? Number(process.env.PORT) : isDevFlag ? 3001 : 3000;
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const STORAGE_DIR = path.resolve(ROOT_DIR, 'storage');
export const UPLOADS_DIR = path.resolve(STORAGE_DIR, 'uploads');
export const DB_PATH = process.env.BRAKASA_DB_PATH || path.resolve(STORAGE_DIR, 'brakasa.db');
export const SCHEMA_PATH = path.resolve(ROOT_DIR, 'server', 'db', 'schema.sql');

export const PUBLIC_MEDIA_DIR = path.resolve(ROOT_DIR, 'public', 'media');
export const DIST_CLIENT_DIR = path.resolve(ROOT_DIR, 'dist', 'client');
export const DEV_INDEX_HTML_PATH = path.resolve(ROOT_DIR, 'index.html');
export const PROD_INDEX_HTML_PATH = path.resolve(DIST_CLIENT_DIR, 'index.html');

export const ADMIN_SESSION_COOKIE = 'brakasa_admin_session';
export const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_ADMIN_USERNAME = process.env.BRAKASA_ADMIN_USER || 'admin';
export const DEFAULT_ADMIN_EMAIL = process.env.BRAKASA_ADMIN_EMAIL || 'admin@brakasa.id';
export const DEFAULT_ADMIN_PASSWORD = process.env.BRAKASA_ADMIN_PASS || 'BrakasaArmory#2026';

export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 40 * 1024 * 1024;
