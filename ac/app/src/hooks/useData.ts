import { useCallback, useEffect, useState } from 'react';
import { Member, Photo } from '@/types';

export function useData() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, init);
    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }
    return res;
  }, []);

  const refreshPhotos = useCallback(async () => {
    try {
      const res = await apiFetch('/api/photos');
      const data = (await res.json()) as Photo[];
      setPhotos(data);
    } catch {
      setPhotos([]);
    }
  }, [apiFetch]);

  useEffect(() => {
    const savedCurrentMember = localStorage.getItem('currentMember');

    if (savedCurrentMember) {
      setCurrentMember(JSON.parse(savedCurrentMember));
    }

    void refreshPhotos();
  }, [refreshPhotos]);

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
        form.append('memberId', currentMember.id);

        await apiFetch('/api/photos', { method: 'POST', body: form });
        await refreshPhotos();
      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, currentMember?.id, refreshPhotos]);

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