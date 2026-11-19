import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { PUBLIC_MEDIA_DIR, UPLOADS_DIR } from '../config.ts';
import { AppError } from '../db/helpers.ts';
import { requireAdminSession } from '../middleware/auth.ts';
import {
  uploadSingleMediaFile,
  validateUploadedMediaFile,
} from '../middleware/upload.ts';
import type {
  AdminMediaListResponse,
  AdminMediaUploadResponse,
  MediaLibraryAsset,
  MediaType,
} from '../../shared/types.ts';

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAdminSession);

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.webm']);

function detectMediaType(filename: string): MediaType | null {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return null;
}

function scanMediaFolder(
  dirPath: string,
  urlPrefix: string,
  folder: MediaLibraryAsset['folder'],
): MediaLibraryAsset[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const assets: MediaLibraryAsset[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) {
      continue;
    }
    const mediaType = detectMediaType(entry.name);
    if (!mediaType) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.size <= 0) {
        continue;
      }
      assets.push({
        url: `${urlPrefix}/${entry.name}`,
        filename: entry.name,
        folder,
        mediaType,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    } catch {
      // Skip unreadable files.
    }
  }
  return assets;
}

adminMediaRouter.get('/', (_req, res) => {
  const assets: MediaLibraryAsset[] = [
    ...scanMediaFolder(UPLOADS_DIR, '/uploads', 'uploads'),
    ...scanMediaFolder(path.join(PUBLIC_MEDIA_DIR, 'videos'), '/media/videos', 'videos'),
    ...scanMediaFolder(
      path.join(PUBLIC_MEDIA_DIR, 'images', 'products'),
      '/media/images/products',
      'products',
    ),
    ...scanMediaFolder(
      path.join(PUBLIC_MEDIA_DIR, 'images', 'hero'),
      '/media/images/hero',
      'hero',
    ),
  ];

  assets.sort((a, b) => {
    if (a.folder === 'uploads' && b.folder !== 'uploads') return -1;
    if (a.folder !== 'uploads' && b.folder === 'uploads') return 1;
    return a.filename.localeCompare(b.filename);
  });

  const response: AdminMediaListResponse = {
    assets,
    total: assets.length,
  };
  res.json(response);
});

adminMediaRouter.post('/upload', uploadSingleMediaFile, (req, res) => {
  if (!req.file) {
    throw new AppError(
      400,
      'MISSING_FILE',
      'Pilih berkas gambar (.jpg, .png, .webp) atau video (.mp4, .webm) pada field file.',
    );
  }

  const { mediaType } = validateUploadedMediaFile(req.file);
  const stat = fs.statSync(req.file.path);

  const asset: MediaLibraryAsset = {
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    folder: 'uploads',
    mediaType,
    sizeBytes: stat.size,
    updatedAt: stat.mtime.toISOString(),
  };

  const response: AdminMediaUploadResponse = { asset };
  res.status(201).json(response);
});
