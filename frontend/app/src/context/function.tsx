import { createContext, ReactNode, use, useMemo} from 'react';
import { Photo, User, Notice } from '@/types';
import { useToken } from './token';
import api from '@/utils/axios';

interface PhotosResult {
    list: Photo[];
    total: number;
    page: number;
    pageSize: number;
}

// 定义类型
interface FunctionContextType {
    loginMemberWithEmail: (email: string, code: string) => Promise<boolean>;
    loginMemberWithPassword: (email: string, password: string) => Promise<boolean>;
    updateMemberProfile: (name: string, bio: string) => Promise<boolean>;
    uploadPhoto: (title: string, description: string, file: File) => Promise<boolean>;
    fetchPhotos: (search?: string, page?: number) => Promise<PhotosResult>;
    fetchOwnerPhotos: (page?: number) => Promise<PhotosResult>;
    fetchMemberProfile: () => Promise<User | null>;
    updatePhoto: (id: string, title?: string, description?: string) => Promise<boolean>;
    deletePhoto: (id: string) => Promise<boolean>;
    fetchNotices: () => Promise<Notice[]>;
    fetchNoticeById: (id: string) => Promise<Notice | null>;
}
// 这个泛型定义可以避免一个ts错误，即在使用 useContext 时，如果上下文为空，会报错
const FunctionContext = createContext<FunctionContextType|null>(null);

export const FunctionProvider = ({ children }: { children: ReactNode }) => {
    const { login} = useToken(); 

    // 获取所有照片
    const fetchPhotos = async (search?: string, page: number = 1) => {
        const empty: PhotosResult = { list: [], total: 0, page: 1, pageSize: 20 };
        try {
            const params = new URLSearchParams();
            if (search?.trim()) params.set('search', search.trim());
            params.set('page', String(page));
            const res = await api.get(`/api/photos?${params.toString()}`);
            return (res.data.data as PhotosResult) ?? empty;
        } catch {
            return empty;
        }
    };

    // 获取用户所有照片
    const fetchOwnerPhotos = async (page: number = 1) => {
        const empty: PhotosResult = { list: [], total: 0, page: 1, pageSize: 30 };
        try {
            const res = await api.get(`/api/photos/user-photos?page=${page}`);
            return (res.data.data as PhotosResult) ?? empty;
        } catch {
            return empty;
        }
    };

    // 验证验证码
    // 用于登录或注册
    const loginMemberWithEmail = async (email: string, code: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = code.trim();
        if (!normalizedEmail || normalizedCode.length !== 6) return false;

        try {
            const res = await api.post('/api/auth/verify-code', {
                    email: normalizedEmail,
                    code: normalizedCode
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            if (!res.data?.data) return false;

            const { authToken } = res.data.data;
            login(authToken);

            return true;
        } catch {
            return false;
        }
    };



    // 密码登录
    const loginMemberWithPassword = async (email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password) return false;

        try {
            const res = await api.post('/api/auth/login', {
                    email: normalizedEmail,
                    password
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            if (!res.data?.data) return false;

            const { authToken } = res.data.data;
            login(authToken);

            return true;
        } catch {
            return false;
        }
    };

    // 获取用户信息
    const fetchMemberProfile = async () => {
        try {
            const res = await api.get(`/api/members/detail`);
            return res.data.data;
        } catch {
            return null;
        }
    };

    const updateMemberProfile = async (name: string, bio: string) => {
        try {
            await api.put(`/api/members/update`, {
                name: name.trim(),
                bio: bio.trim()
            });
            return true;
        } catch {
            return false;
        }
    };

    // 上传照片
    const uploadPhoto = async (title: string, description: string, file: File) => {
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('title', title);
            form.append('description', description);

            await api.post('/api/photos', form);
            return true;
        } catch {
            return false;
        }
    };

    // 修改照片信息
    const updatePhoto = async (id: string, title?: string, description?: string) => {
        try {
            await api.put(`/api/photos/${id}`, {
                title: title?.trim(),
                description: description?.trim(),
            });
            return true;
        } catch {
            return false;
        }
    };

    // 删除照片
    const deletePhoto = async (id: string) => {
        try {
            await api.delete(`/api/photos/${id}`);
            return true;
        } catch {
            return false;
        }
    };

    // 获取所有通知
    const fetchNotices = async () => {
        try {
            const res = await api.get('/api/notice');
            return res.data.data as Notice[];
        } catch {
            return [];
        }
    };

    // 获取单个通知详情
    const fetchNoticeById = async (id: string) => {
        try {
            const res = await api.get(`/api/notice/${id}`);
            return res.data.data as Notice;
        } catch {
            return null;
        }
    }

    const value = useMemo(() => ({
        loginMemberWithEmail,
        loginMemberWithPassword,
        updateMemberProfile,
        uploadPhoto,
        fetchPhotos,
        fetchOwnerPhotos,
        fetchMemberProfile,
        updatePhoto,
        deletePhoto,
        fetchNotices,
        fetchNoticeById
    }), [loginMemberWithEmail,
        loginMemberWithPassword,
        updateMemberProfile,
        uploadPhoto,
        fetchPhotos,
        fetchOwnerPhotos,
        fetchMemberProfile,
        updatePhoto,
        deletePhoto,
        fetchNotices,
        fetchNoticeById]);
    return (
    <FunctionContext value={value}>
        {children}
    </FunctionContext>
    );
};

// 3. 自定义 Hook，方便外部调用
export const useFunction = () => {
  const context = use(FunctionContext);
  if (!context) {
    throw new Error('useFunction must be used within a FunctionProvider');
  }
  return context;
};