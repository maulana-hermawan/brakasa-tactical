import type { ApiErrorResponse } from '../../shared/types';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[] | string>;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: Record<string, string[] | string>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.error !== 'object' || candidate.error === null) return false;
  const errObj = candidate.error as Record<string, unknown>;
  return typeof errObj.message === 'string' && typeof errObj.code === 'string';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let parsedBody: unknown = null;
  if (response.status !== 204) {
    if (isJson) {
      try {
        parsedBody = await response.json();
      } catch {
        parsedBody = null;
      }
    } else {
      try {
        const text = await response.text();
        parsedBody = text ? { rawText: text } : null;
      } catch {
        parsedBody = null;
      }
    }
  }

  if (!response.ok) {
    if (isApiErrorBody(parsedBody)) {
      throw new ApiRequestError(
        parsedBody.error.message,
        response.status,
        parsedBody.error.code,
        parsedBody.error.details,
      );
    }

    const fallbackMessage =
      response.status === 401
        ? 'Sesi admin telah berakhir atau tidak valid. Silakan masuk kembali.'
        : response.status === 404
          ? 'Data yang diminta tidak ditemukan di server.'
          : response.status === 429
            ? 'Terlalu banyak permintaan dalam waktu singkat. Tunggu beberapa saat lalu coba lagi.'
            : `Permintaan gagal diproses oleh server (HTTP ${response.status}).`;

    throw new ApiRequestError(fallbackMessage, response.status, `HTTP_${response.status}`);
  }

  return parsedBody as T;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (
    init?.body !== undefined &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiRequestError(
      'Koneksi ke server Brakasa Tactical terputus. Periksa jaringan internet Anda lalu coba lagi.',
      0,
      'NETWORK_ERROR',
    );
  }

  return parseResponse<T>(response);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiRequestError(
      'Gagal mengunggah berkas ke server. Periksa koneksi internet Anda lalu coba lagi.',
      0,
      'NETWORK_ERROR',
    );
  }

  return parseResponse<T>(response);
}
