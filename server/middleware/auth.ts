import type { NextFunction, Request, Response } from 'express';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS, IS_PRODUCTION } from '../config.ts';
import { getAdminBySessionToken } from '../services/authService.ts';
import { sendError } from '../db/helpers.ts';
import type { AdminUserProfile } from '../../shared/types.ts';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUserProfile;
      adminSessionToken?: string;
    }
  }
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) {
    return cookies;
  }
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

export function setAdminSessionCookie(req: Request, res: Response, rawToken: string): void {
  const isHttps =
    req.secure ||
    (typeof req.headers['x-forwarded-proto'] === 'string' &&
      req.headers['x-forwarded-proto'].includes('https'));
  const useSecure = IS_PRODUCTION && isHttps;

  const directives = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(rawToken)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`,
  ];
  if (useSecure) {
    directives.push('Secure');
  }
  res.setHeader('Set-Cookie', directives.join('; '));
}

export function clearAdminSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  );
}

function isLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '[::1]';
}

function isSameOriginAllowed(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const originHeader = req.headers.origin || req.headers.referer;
  if (!originHeader || typeof originHeader !== 'string') {
    return true;
  }

  const requestHostHeader =
    (typeof req.headers['x-forwarded-host'] === 'string' && req.headers['x-forwarded-host']) ||
    req.headers.host;
  if (!requestHostHeader) {
    return false;
  }

  try {
    const parsedOrigin = new URL(originHeader);
    const reqHostLower = requestHostHeader.toLowerCase();
    if (parsedOrigin.host.toLowerCase() === reqHostLower) {
      return true;
    }
    const reqHostname = reqHostLower.split(':')[0] ?? '';
    if (isLoopbackHost(parsedOrigin.hostname) && isLoopbackHost(reqHostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (!isSameOriginAllowed(req)) {
    sendError(res, 403, 'CSRF_ORIGIN_MISMATCH', 'Permintaan ditolak karena asal host tidak sah.');
    return;
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  const rawToken = cookies[ADMIN_SESSION_COOKIE];

  if (!rawToken) {
    sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Sesi admin diperlukan. Silakan masuk terlebih dahulu melalui halaman login admin.',
    );
    return;
  }

  const admin = getAdminBySessionToken(rawToken);
  if (!admin) {
    clearAdminSessionCookie(res);
    sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Sesi admin tidak valid atau telah berakhir. Silakan masuk kembali.',
    );
    return;
  }

  req.admin = admin;
  req.adminSessionToken = rawToken;
  next();
}
