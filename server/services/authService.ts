import crypto from 'node:crypto';
import { db } from '../db/connection.ts';
import { ADMIN_SESSION_TTL_MS } from '../config.ts';
import type { AdminRole, AdminUserProfile } from '../../shared/types.ts';

interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: string;
  is_active: number;
}

interface AdminSessionJoinRow {
  token_hash: string;
  expires_at: string;
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: string;
  is_active: number;
}

export function hashPassword(password: string): string {
  const saltHex = crypto.randomBytes(16).toString('hex');
  const derivedHex = crypto.scryptSync(password, saltHex, 64).toString('hex');
  return `scrypt$${saltHex}$${derivedHex}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) {
    return false;
  }
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const actualBuf = crypto.scryptSync(password, saltHex, expectedBuf.length);
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function authenticateAdmin(
  identifier: string,
  password: string,
  meta: { userAgent?: string; ipAddress?: string },
): { rawToken: string; expiresAt: string; admin: AdminUserProfile } | null {
  const normalized = identifier.trim();
  if (!normalized || !password) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, username, email, display_name, password_hash, role, is_active
       FROM admin_users
       WHERE (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE)
       LIMIT 1`,
    )
    .get(normalized, normalized) as AdminUserRow | undefined;

  if (!row || Number(row.is_active) !== 1) {
    return null;
  }

  if (!verifyPassword(password, row.password_hash)) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString();

  db.prepare(
    `DELETE FROM admin_sessions WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).run();

  db.prepare(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(tokenHash, row.id, expiresAt, meta.userAgent ?? null, meta.ipAddress ?? null);

  return {
    rawToken,
    expiresAt,
    admin: {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      role: row.role as AdminRole,
    },
  };
}

export function getAdminBySessionToken(rawToken: string): AdminUserProfile | null {
  if (!rawToken || rawToken.length < 32) {
    return null;
  }
  const tokenHash = hashSessionToken(rawToken);
  const row = db
    .prepare(
      `SELECT s.token_hash, s.expires_at, u.id, u.username, u.email, u.display_name, u.role, u.is_active
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_id
       WHERE s.token_hash = ?
       LIMIT 1`,
    )
    .get(tokenHash) as AdminSessionJoinRow | undefined;

  if (!row || Number(row.is_active) !== 1) {
    return null;
  }

  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    role: row.role as AdminRole,
  };
}

export function revokeSessionToken(rawToken: string): void {
  if (!rawToken) {
    return;
  }
  const tokenHash = hashSessionToken(rawToken);
  db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
}
