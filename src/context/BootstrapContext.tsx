import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BootstrapResponse } from '../../shared/types';
import { apiFetch, ApiRequestError } from '../lib/api';

interface BootstrapContextValue {
  data: BootstrapResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function BootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<BootstrapResponse>('/api/bootstrap');
      setData(response);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat konfigurasi utama Brakasa Tactical.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <BootstrapContext.Provider value={{ data, loading, error, reload }}>
      {children}
    </BootstrapContext.Provider>
  );
}

export function useBootstrap(): BootstrapContextValue {
  const ctx = useContext(BootstrapContext);
  if (!ctx) {
    throw new Error('useBootstrap harus digunakan di dalam BootstrapProvider.');
  }
  return ctx;
}
