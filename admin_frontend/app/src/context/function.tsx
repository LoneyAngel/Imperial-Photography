import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { AdminUser, Photo } from '@/types';
import api from '@/lib/axios';

interface AdminWithRole {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  roleId: number;
}

interface Notice {
  id: string;
  title: string;
  contentUrl: string;
  createdAt: string;
  createdMemberId: string;
}

interface AdminFunctionContextType {
  loginAdmin: (email: string, password: string) => Promise<{ authToken: string; roleId: number } | null>;
  fetchAllUsers: () => Promise<AdminUser[]>;
  updateUser: (id: string, data: { name?: string; bio?: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  fetchAllPhotos: (status?: 'pending' | 'approved' | 'rejected') => Promise<Photo[]>;
  updatePhotoStatus: (id: string, status: 'pending' | 'approved' | 'rejected') => Promise<boolean>;
  deletePhoto: (id: string) => Promise<boolean>;
  fetchAdmins: () => Promise<AdminWithRole[]>;
  updateUserRole: (id: string, roleId: number) => Promise<boolean>;
  fetchNotices: () => Promise<Notice[]>;
  createNotice: (title: string, content: string) => Promise<Notice | null>;
  updateNotice: (id: string, data: { title?: string; content?: string }) => Promise<boolean>;
  deleteNotice: (id: string) => Promise<boolean>;
}

const AdminFunctionContext = createContext<AdminFunctionContextType | null>(null);

export const AdminFunctionProvider = ({ children }: { children: ReactNode }) => {
  const loginAdmin = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      if (!res.data) return null;
      // refreshToken 通过 HttpOnly Cookie 自动保存
      const { authToken, roleId } = res.data;
      return { authToken, roleId };
    } catch {
      return null;
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users');
      return res.data as AdminUser[];
    } catch {
      return [];
    }
  }, []);

  const updateUser = useCallback(async (id: string, data: { name?: string; bio?: string }) => {
    try {
      await api.put(`/api/admin/users/${id}`, data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchAllPhotos = useCallback(async (status?: 'pending' | 'approved' | 'rejected') => {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await api.get(`/api/admin/photos${query}`);
      return res.data as Photo[];
    } catch {
      return [];
    }
  }, []);

  const updatePhotoStatus = useCallback(async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      await api.put(`/api/admin/photos/${id}/status`, { status });
      return true;
    } catch {
      return false;
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/photos/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/admins');
      return res.data as AdminWithRole[];
    } catch {
      return [];
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, roleId: number) => {
    try {
      await api.put(`/api/admin/admins/${id}/role`, { roleId });
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/notices');
      return res.data as Notice[];
    } catch {
      return [];
    }
  }, []);

  const createNotice = useCallback(async (title: string, content: string) => {
    try {
      const res = await api.post('/api/admin/notices', { title, content });
      return res.data as Notice;
    } catch {
      return null;
    }
  }, []);

  const updateNotice = useCallback(async (id: string, data: { title?: string; content?: string }) => {
    try {
      await api.put(`/api/admin/notices/${id}`, data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteNotice = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/admin/notices/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(() => ({
    loginAdmin,
    fetchAllUsers,
    updateUser,
    deleteUser,
    fetchAllPhotos,
    updatePhotoStatus,
    deletePhoto,
    fetchAdmins,
    updateUserRole,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
  }), [loginAdmin, fetchAllUsers, updateUser, deleteUser, fetchAllPhotos, updatePhotoStatus, deletePhoto, fetchAdmins, updateUserRole, fetchNotices, createNotice, updateNotice, deleteNotice]);

  return (
    <AdminFunctionContext.Provider value={value}>
      {children}
    </AdminFunctionContext.Provider>
  );
};

export const useAdminFunction = () => {
  const context = useContext(AdminFunctionContext);
  if (!context) {
    throw new Error('useAdminFunction must be used within an AdminFunctionProvider');
  }
  return context;
};