import { useCallback, useEffect, useState } from 'react';
import { Photo } from '@/types';
import { useAuth } from './useAuth';

export function useData() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { user, token, isAuthenticated, login, logout: authLogout, updateUser } = useAuth();

  // API Fetch with token
  const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = {
      ...init?.headers,
      ...(token && !(init?.headers as any)?.Authorization && {
        Authorization: `Bearer ${token}`
      }),
    };

    const res = await fetch(input, {
      ...init,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `API ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = '无法解析错误信息';
      }
      throw new Error(errorMessage);
    }

    return res;
  }, [token]);

  // 刷新照片列表
  const refreshPhotos = useCallback(async () => {
    try {
      const res = await apiFetch('/api/photos');
      const data = (await res.json()) as Photo[];
      setPhotos(data);
    } catch {
      setPhotos([]);
    }
  }, [apiFetch]);

  // 初始化时刷新照片
  useEffect(() => {
    void refreshPhotos();
  }, [refreshPhotos]);

  // 邮箱验证码认证
  // 用于登录或注册
  const loginMemberWithEmail = useCallback(async (email: string, code: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    if (!normalizedEmail || normalizedCode.length !== 6) return false;

    try {
      const res = await apiFetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: normalizedCode }),
      });

      // ✅ 使用新的响应格式 { user, token }
      const { user, token: authToken } = await res.json();
      login(user, authToken); // 使用useAuth的login方法
      return true;
    } catch {
      return false;
    }
  }, [apiFetch, login]);

  // 密码登录
  const loginMemberWithPassword = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return false;

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      // ✅ 使用新的响应格式 { user, token }
      const { user, token: authToken } = await res.json();
      login(user, authToken); // 使用useAuth的login方法
      return true;
    } catch {
      return false;
    }
  }, [apiFetch, login]);

  // 登出
  const logoutMember = useCallback(() => {
    authLogout(); // 使用useAuth的logout方法
    setPhotos([]); // 清除照片数据
  }, [authLogout]);

  // 更新用户资料
  const updateMemberProfile = useCallback(async (name: string, bio: string) => {
    if (!user) return false;

    try {
      const res = await apiFetch(`/api/members/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });

      const updatedUser = await res.json();
      updateUser(updatedUser); // 使用useAuth的updateUser方法
      return true;
    } catch {
      return false;
    }
  }, [apiFetch, user, updateUser]);

  // 上传照片
  const uploadPhoto = useCallback((title: string, description: string, file: File) => {
    void (async () => {
      try {
        if (!user?.id) {
          console.error('用户未登录，无法上传照片');
          return;
        }

        const form = new FormData();
        form.append('file', file);
        form.append('title', title);
        form.append('description', description);
        // ✅ memberId已从JWT Token获取，无需从前端发送

        await apiFetch('/api/photos', { method: 'POST', body: form });
        await refreshPhotos();
      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, user?.id, refreshPhotos]);

  return {
    photos,
    user,
    isAuthenticated,
    loginMemberWithEmail,
    loginMemberWithPassword,
    logoutMember,
    updateMemberProfile,
    uploadPhoto,
  };
}