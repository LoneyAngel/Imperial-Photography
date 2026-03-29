import { useCallback } from 'react';
import { Photo } from '@/types';
import { useAuth } from './useAuth';

export function useData() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuth();

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
      if (res.status === 401) {
        // token过期或无效，自动登出
        logout();
        errorMessage = 'token过期或无效';
      }
      else try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = '无法解析错误信息';
      }
      throw new Error(errorMessage);
    }
    return res;
  }, [token]);
  async function fetchPhotos() {
    try {
      const res = await apiFetch('/api/photos');
      const data = (await res.json()) as Photo[];
      return data;
    } catch {
      return [];
    }
  }

  async function fetchOwnerPhotos(id: string) {
    const res = await apiFetch(`/api/photos?ownerMemberId=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (res.ok) {
      const data = (await res.json()) as Photo[];
      return data;
    }
  }

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
    logout(); // 使用useAuth的logout方法
  }, [logout]);

  // 更新用户资料
  const updateMemberProfile = useCallback(async (name: string, bio: string) => {
    if (!user) return false;
    try {
      const res = await apiFetch(`/api/members/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });

      const newUser = await res.json();
      updateUser(newUser); // 使用useAuth的updateUser方法
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

      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, user?.id]);

  async function getMemberBio() {
    if (!user?.id) return '';
    try {
      const res = await apiFetch(`/api/members/bio`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (user && data.bio !== user.bio) {
        updateUser({ ...user, bio: data.bio ?? '' });
      }
      return data.bio ?? '';
    } catch {
      return '';
    }
  }

  return {
    user,
    isAuthenticated,
    loginMemberWithEmail,
    loginMemberWithPassword,
    logoutMember,
    updateMemberProfile,
    uploadPhoto,
    fetchPhotos,
    fetchOwnerPhotos,
    getMemberBio,
  };
}