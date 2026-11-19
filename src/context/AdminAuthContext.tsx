import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AdminAuthMeResponse,
  AdminLoginRequest,
  AdminLogoutResponse,
  AdminUserProfile,
} from '../../shared/types';
import { ApiRequestError, apiFetch } from '../lib/api';

export interface AdminAuthContextValue {
  admin: AdminUserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [admin, setAdmin] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const response = await apiFetch<AdminAuthMeResponse>('/api/admin/auth/me');
      if (response.authenticated && response.admin) {
        setAdmin(response.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setAdmin(null);
      } else {
        setAdmin(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    const payload: AdminLoginRequest = {
      username: username.trim(),
      password,
    };
    const response = await apiFetch<AdminAuthMeResponse>('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.authenticated && response.admin) {
      setAdmin(response.admin);
      setLoading(false);
      return;
    }

    throw new ApiRequestError(
      'Autentikasi gagal. Periksa kembali kredensial akun staf Anda.',
      401,
      'UNAUTHORIZED',
    );
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch<AdminLogoutResponse>('/api/admin/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Sesi lokal tetap dibersihkan walaupun cookie sudah kedaluwarsa di server.
    } finally {
      setAdmin(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      loading,
      login,
      logout,
      refresh,
    }),
    [admin, loading, login, logout, refresh],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth harus dipanggil di dalam AdminAuthProvider.');
  }
  return ctx;
}
