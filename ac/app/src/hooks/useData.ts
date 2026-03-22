import { useCallback, useEffect, useState } from 'react';
import { Member, Photo } from '@/types';

export function useData() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    // ✅ 添加JWT Token到请求头
    const token = currentMember?.token;
    const headers = {
      ...init?.headers,
      // 只有当token存在且没有手动设置Authorization时才添加
      ...(token && !(init?.headers as any)?.Authorization && {
        Authorization: `Bearer ${token}`
      }),
    };

    const res = await fetch(input, {
      ...init,
      headers,
    });

    if (!res.ok) {
      // ✅ 更详细的错误处理
      let errorMessage = `API ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // 如果无法解析JSON，使用默认错误信息
      }
      throw new Error(errorMessage);
    }

    return res;
  }, [currentMember?.token, currentMember]); // ✅ 更精确的依赖

  const refreshPhotos = useCallback(async () => {
    try {
      const token = currentMember?.token;
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/photos', { headers });
      if (!res.ok) throw new Error('Failed to fetch photos');

      const data = (await res.json()) as Photo[];
      setPhotos(data);
    } catch {
      setPhotos([]);
    }
  }, [currentMember?.token]);

  useEffect(() => {
    const savedCurrentMember = localStorage.getItem('currentMember');

    if (savedCurrentMember) {
      setCurrentMember(JSON.parse(savedCurrentMember));
    }

    // ✅ 只在组件挂载时刷新一次照片，避免循环依赖
    void refreshPhotos();
  }, []); // ✅ 空依赖数组，只执行一次

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
      const member = (await res.json()) as Member;
      setCurrentMember(member);
      localStorage.setItem('currentMember', JSON.stringify(member));
      return true;
    } catch {
      return false;
    }
  }, [apiFetch]);

  const loginMemberWithPassword = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return false;

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const member = (await res.json()) as Member;
      setCurrentMember(member);
      localStorage.setItem('currentMember', JSON.stringify(member));
      return true;
    } catch {
      return false;
    }
  }, [apiFetch]);

  const logoutMember = () => {
    setCurrentMember(null);
    localStorage.removeItem('currentMember');
  };

  const updateMemberProfile = useCallback((displayName: string, bio: string) => {
    if (!currentMember) return false;

    void (async () => {
      try {
        const res = await apiFetch(`/api/members/${currentMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: displayName.trim(), bio: bio.trim() }),
        });
        const updated = (await res.json()) as Member;
        setCurrentMember(updated);
        localStorage.setItem('currentMember', JSON.stringify(updated));
      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, currentMember]);

  // 上传照片
  const uploadPhoto = useCallback((title: string, description: string, file: File) => {
    void (async () => {
      try {
        if (!currentMember?.id) {
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
  }, [apiFetch, currentMember?.id]);

  return {
    photos,
    currentMember,
    loginMemberWithEmail,
    loginMemberWithPassword,
    logoutMember,
    updateMemberProfile,
    uploadPhoto,
  };
}