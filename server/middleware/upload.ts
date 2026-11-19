import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  UPLOADS_DIR,
} from '../config.ts';
import { AppError } from '../db/helpers.ts';
import type { MediaType } from '../../shared/types.ts';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm']);
const ALLOWED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(
        new AppError(
          400,
          'INVALID_FILE_TYPE',
          'Format berkas tidak didukung. Gunakan .jpg, .jpeg, .png, .webp, .mp4, atau .webm.',
        ),
      );
      return;
    }
    cb(null, true);
  },
});

export function uploadSingleMediaFile(req: Request, res: Response, next: NextFunction): void {
  multerInstance.single('file')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof AppError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(
          new AppError(
            400,
            'FILE_TOO_LARGE',
            'Ukuran berkas melebihi batas maksimal (8 MB untuk gambar, 40 MB untuk video).',
          ),
        );
        return;
      }
      next(new AppError(400, 'UPLOAD_ERROR', `Gagal memproses unggahan: ${err.message}`));
      return;
    }
    next(err);
  });
}

function readHeaderBytes(filePath: string, length: number): Buffer {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function matchesMagicBytes(ext: string, header: Buffer): boolean {
  if (ext === '.jpg' || ext === '.jpeg') {
    return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }
  if (ext === '.png') {
    const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return header.length >= 8 && pngSig.every((byte, idx) => header[idx] === byte);
  }
  if (ext === '.webp') {
    return (
      header.length >= 12 &&
      header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (ext === '.mp4') {
    return header.length >= 8 && header.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (ext === '.webm') {
    return (
      header.length >= 4 &&
      header[0] === 0x1a &&
      header[1] === 0x45 &&
      header[2] === 0xdf &&
      header[3] === 0xa3
    );
  }
  return false;
}

export function validateUploadedMediaFile(file: Express.Multer.File): {
  mediaType: MediaType;
  ext: string;
} {
  const ext = path.extname(file.filename).toLowerCase();
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isVideo = VIDEO_EXTENSIONS.has(ext);

  const removeTemp = (): void => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {
      // Ignore cleanup errors if already unlinked.
    }
  };

  if (!isImage && !isVideo) {
    removeTemp();
    throw new AppError(400, 'INVALID_FILE_TYPE', 'Ekstensi berkas media tidak diizinkan.');
  }

  const maxBytes = isImage ? MAX_IMAGE_UPLOAD_BYTES : MAX_VIDEO_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    removeTemp();
    throw new AppError(
      400,
      'FILE_TOO_LARGE',
      isImage
        ? 'Ukuran gambar melebihi batas maksimal 8 MB.'
        : 'Ukuran video melebihi batas maksimal 40 MB.',
    );
  }

  const header = readHeaderBytes(file.path, 16);
  if (!matchesMagicBytes(ext, header)) {
    removeTemp();
    throw new AppError(
      400,
      'INVALID_MEDIA_SIGNATURE',
      'Signature biner berkas tidak cocok dengan ekstensi gambar/video yang valid.',
    );
  }

  return {
    mediaType: isImage ? 'image' : 'video',
    ext,
  };
}
