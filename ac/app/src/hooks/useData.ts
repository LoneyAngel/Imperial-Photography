import { useCallback, useEffect, useState } from 'react';
import { Member, Photographer, Photo } from '@/types';

export function useData() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPhotographer, setCurrentPhotographer] = useState<{ id: string; name: string } | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, init);
    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }
    return res;
  }, []);

  const refreshPhotographers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/photographers');
      const data = (await res.json()) as Photographer[];
      setPhotographers(data);
    } catch {
      setPhotographers([]);
    }
  }, [apiFetch]);

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
    const savedCurrentPhotographer = localStorage.getItem('currentPhotographer');
    const savedCurrentMember = localStorage.getItem('currentMember');

    if (savedCurrentPhotographer) {
      setCurrentPhotographer(JSON.parse(savedCurrentPhotographer));
    }
    if (savedCurrentMember) {
      setCurrentMember(JSON.parse(savedCurrentMember));
    }

    void refreshPhotographers();
    void refreshPhotos();
  }, [refreshPhotographers, refreshPhotos]);

  // 注册摄影师
  const registerPhotographer = useCallback((name: string, bio: string) => {
    void (async () => {
      try {
        const res = await apiFetch('/api/photographers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, bio }),
        });
        const newPhotographer = (await res.json()) as Photographer;
        await refreshPhotographers();

        const currentUser = { id: newPhotographer.id, name: newPhotographer.name };
        setCurrentPhotographer(currentUser);
        localStorage.setItem('currentPhotographer', JSON.stringify(currentUser));
      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, refreshPhotographers]);

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
  const uploadPhoto = useCallback((title: string, description: string, file: File, photographerName: string) => {
    void (async () => {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('title', title);
        form.append('description', description);
        form.append('photographerName', photographerName);
        if (currentPhotographer?.id) form.append('photographerId', currentPhotographer.id);
        if (currentMember?.id) form.append('ownerMemberId', currentMember.id);

        await apiFetch('/api/photos', { method: 'POST', body: form });
        await refreshPhotos();
      } catch {
        return;
      }
    })();

    return true;
  }, [apiFetch, currentMember?.id, currentPhotographer?.id, refreshPhotos]);

  // 审核通过
  return {
    photographers,
    photos,
    currentPhotographer,
    currentMember,
    registerPhotographer,
    loginMemberWithEmail,
    loginMemberWithPassword,
    logoutMember,
    updateMemberProfile,
    uploadPhoto,
  };
}
