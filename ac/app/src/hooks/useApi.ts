import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type ApiResponse<T> = {
  data: T;
  ok: true;
} | {
  error: string;
  ok: false;
};

export function useApi<T = any>(url: string, options: RequestInit = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (body?: any): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        ...options,
        ...(body && { body: JSON.stringify(body) }),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data.error || '请求失败';
        setState(prev => ({ ...prev, loading: false, error }));
        return { error, ok: false };
      }

      setState(prev => ({ ...prev, loading: false, data, error: null }));
      return { data, ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: errorMessage, ok: false };
    }
  }, [url, options]);

  return {
    ...state,
    execute,
  };
}

// 通用的认证API hooks
export function useAuthApi() {
  const requestCode = useCallback(async (email: string) => {
    const res = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return res.ok;
  }, []);

  const login = useCallback(async (email: string, password?: string, code?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, code }),
    });
    return res.ok;
  }, []);

  return {
    requestCode,
    verifyCode,
    login,
  };
}