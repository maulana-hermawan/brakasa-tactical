import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../db/helpers.ts';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    const existing = hits.get(ip) ?? [];
    const recent = existing.filter((ts) => ts > cutoff);

    if (recent.length >= options.maxRequests) {
      const oldest = recent[0] ?? now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      sendError(res, 429, 'RATE_LIMITED', options.message);
      return;
    }

    recent.push(now);
    hits.set(ip, recent);

    if (hits.size > 5000) {
      for (const [key, timestamps] of hits.entries()) {
        const filtered = timestamps.filter((ts) => ts > cutoff);
        if (filtered.length === 0) {
          hits.delete(key);
        } else {
          hits.set(key, filtered);
        }
      }
    }

    next();
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Terlalu banyak percobaan login. Tunggu 15 menit sebelum mencoba lagi.',
});

export const orderLookupRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Batas pencarian pesanan sementara tercapai. Tunggu beberapa menit lalu ulangi.',
});
