import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../db/helpers.ts';
import {
  clearAdminSessionCookie,
  requireAdminSession,
  setAdminSessionCookie,
} from '../middleware/auth.ts';
import { loginRateLimiter } from '../middleware/rateLimit.ts';
import { authenticateAdmin, revokeSessionToken } from '../services/authService.ts';
import type { AdminAuthMeResponse, AdminLogoutResponse } from '../../shared/types.ts';

export const adminAuthRouter = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username atau email wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

adminAuthRouter.post('/login', loginRateLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Username atau email dan kata sandi wajib diisi.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const authResult = authenticateAdmin(parsed.data.username, parsed.data.password, {
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    ipAddress: req.ip || req.socket.remoteAddress || undefined,
  });

  if (!authResult) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Username atau kata sandi tidak sesuai. Periksa kembali kredensial akun staf Anda.',
    );
  }

  setAdminSessionCookie(req, res, authResult.rawToken);

  const response: AdminAuthMeResponse = {
    authenticated: true,
    admin: authResult.admin,
  };
  res.json(response);
});

adminAuthRouter.post('/logout', requireAdminSession, (req, res) => {
  if (req.adminSessionToken) {
    revokeSessionToken(req.adminSessionToken);
  }
  clearAdminSessionCookie(res);
  const response: AdminLogoutResponse = { ok: true };
  res.json(response);
});

adminAuthRouter.get('/me', requireAdminSession, (req, res) => {
  const response: AdminAuthMeResponse = {
    authenticated: true,
    admin: req.admin!,
  };
  res.json(response);
});
