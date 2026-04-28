import { createContext, ReactNode, use } from 'react';
import { Photo, User, Notice } from '@/types';
import { useToken } from './token';
import api from '@/utils/axios';

interface PhotosResult {
  list: Photo[];
  total: number;
  page: number;
  pageSize: number;
}

interface FunctionContextType {
  verifyCode: (email: string, code: string) => Promise<{ message: string } | null>;
  loginMemberWithPassword: (email: string, password: string) => Promise<{ message: string } | null>;
  updateMemberProfile: (name: string, bio: string) => Promise<boolean>;
  uploadPhoto: (title: string, description: string, file: File) => Promise<boolean>;
  fetchPhotos: (search?: string, page?: number) => Promise<PhotosResult>;
  fetchOwnerPhotos: (page?: number) => Promise<PhotosResult>;
  fetchMemberProfile: () => Promise<User | null>;
  updatePhoto: (id: string, title?: string, description?: string) => Promise<boolean>;
  deletePhoto: (id: string) => Promise<boolean>;
  fetchNotices: () => Promise<Notice[]>;
  fetchNoticeById: (id: string) => Promise<Notice | null>;
  sendAuthCode: (email: string) => Promise<{ message: string } | null>;
  sendRegisterCode: (email: string) => Promise<{ message: string } | null>;
  set_password: (email: string, password: string) => Promise<{ message: string } | null>;
  resetPassword: (email: string, password: string) => Promise<{ message: string } | null>;
}

const FunctionContext = createContext<FunctionContextType | null>(null);

export const FunctionProvider = ({ children }: { children: ReactNode }) => {
  const { login } = useToken();

  const fetchPhotos = async (search?: string, page: number = 1) => {
    const empty: PhotosResult = { list: [], total: 0, page: 1, pageSize: 20 };
    try {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      const res = await api.get(`/photos?${params.toString()}`);
      return (res.data.data as PhotosResult) ?? empty;
    } catch {
      return empty;
    }
  };

  const fetchOwnerPhotos = async (page: number = 1) => {
    const empty: PhotosResult = { list: [], total: 0, page: 1, pageSize: 30 };
    try {
      const res = await api.get(`/photos/user-photos?page=${page}`);
      return (res.data.data as PhotosResult) ?? empty;
    } catch {
      return empty;
    }
  };

  const fetchMemberProfile = async () => {
    try {
      const res = await api.get(`/members/detail`);
      return res.data.data;
    } catch {
      return null;
    }
  };

  const updateMemberProfile = async (name: string, bio: string) => {
    try {
      await api.put(`/members/update`, {
        name: name.trim(),
        bio: bio.trim(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const uploadPhoto = async (title: string, description: string, file: File) => {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title);
      form.append('description', description);

      await api.post('/photos', form);
      return true;
    } catch {
      return false;
    }
  };

  const updatePhoto = async (id: string, title?: string, description?: string) => {
    try {
      await api.put(`/photos/${id}`, {
        title: title?.trim(),
        description: description?.trim(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await api.delete(`/photos/${id}`);
      return true;
    } catch {
      return false;
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notice');
      return res.data.data as Notice[];
    } catch {
      return [];
    }
  };

  const fetchNoticeById = async (id: string) => {
    try {
      const res = await api.get(`/notice/${id}`);
      return res.data.data as Notice;
    } catch {
      return null;
    }
  };

  const sendAuthCode = async (email: string) => {
    try {
      const res = await api.post(
        '/auth/request-code',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) return null;
      else return { message: res.data.message || '验证码发送失败，请稍后重试' };
    } catch {
      return { message: '验证码发送失败，请稍后重试' };
    }
  };

  const sendRegisterCode = async (email: string) => {
    try {
      const res = await api.post(
        '/auth/request-register-code',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) return null;
      else return { message: res.data.message || '验证码发送失败，请稍后重试' };
    } catch {
      return { message: '验证码发送失败，请稍后重试' };
    }
  };

  const verifyCode = async (email: string, code: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    if (!normalizedEmail || normalizedCode.length !== 6) return null;

    try {
      const res = await api.post(
        '/auth/verify-code',
        { email: normalizedEmail, code: normalizedCode },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) {
        const { authToken } = res.data.data;
        login(authToken);
        return null;
      } else return { message: res.data.message || '登录失败，请检查验证码后重试' };
    } catch {
      throw new Error('verify-code 出现意外错误');
    }
  };

  const loginMemberWithPassword = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { message: '请输入邮箱和密码' };

    try {
      const res = await api.post(
        '/auth/login',
        { email: normalizedEmail, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) {
        const { authToken } = res.data.data;
        login(authToken);
        return null;
      } else return { message: res.data.message || '登录失败，请检查邮箱和密码后重试' };
    } catch {
      return { message: '登录出现意外错误' };
    }
  };

  const set_password = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { message: '请输入邮箱和密码' };

    try {
      const res = await api.post(
        '/auth/set-password',
        { email: normalizedEmail, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) {
        const { authToken } = res.data.data;
        login(authToken);
        return null;
      } else return { message: res.data.message || '密码设置失败，请重试' };
    } catch {
      return { message: '密码设置出现意外错误' };
    }
  };

  const resetPassword = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { message: '请输入邮箱和密码' };
    try {
      const res = await api.post(
        '/auth/reset-password',
        { email: normalizedEmail, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 200) return null;
      return { message: res.data.message || '重置密码失败，请重试' };
    } catch {
      return { message: '重置密码出现意外错误' };
    }
  };

  const value = {
    verifyCode,
    loginMemberWithPassword,
    updateMemberProfile,
    uploadPhoto,
    fetchPhotos,
    fetchOwnerPhotos,
    fetchMemberProfile,
    updatePhoto,
    deletePhoto,
    fetchNotices,
    fetchNoticeById,
    sendAuthCode,
    sendRegisterCode,
    set_password,
    resetPassword,
  };

  return <FunctionContext value={value}>{children}</FunctionContext>;
};

export const useFunction = () => {
  const context = use(FunctionContext);
  if (!context) {
    throw new Error('useFunction must be used within a FunctionProvider');
  }
  return context;
};
