import { createContext, ReactNode, useCallback, useContext, useMemo} from 'react';
import { Photo, User } from '@/types';
import { useToken } from './token';
import api from '@/lib/axios';
// 定义类型
interface FunctionContextType {
    loginMemberWithEmail: (email: string, code: string) => Promise<boolean>;
    loginMemberWithPassword: (email: string, password: string) => Promise<boolean>;
    updateMemberProfile: (name: string, bio: string) => Promise<boolean>;
    uploadPhoto: (title: string, description: string, file: File) => boolean;
    fetchPhotos: () => Promise<Photo[]>;
    fetchOwnerPhotos: (id: string) => Promise<Photo[]>;
    fetchMemberProfile: () => Promise<User | null>;
}
// 这个泛型定义可以避免一个ts错误，即在使用 useContext 时，如果上下文为空，会报错
const FunctionContext = createContext<FunctionContextType|null>(null);

export const FunctionProvider = ({ children }: { children: ReactNode }) => {
    const { login} = useToken(); 

    // 获取所有照片
    const fetchPhotos = useCallback(async () => {
        try {
            const res = await api.get('/api/photos');
            return res.data as Photo[];
        } catch {
            return [];
        }
    }, []);

    // 获取用户所有照片
    const fetchOwnerPhotos = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/api/photos?ownerMemberId=${id}`);
            return res.data as Photo[];
        } catch {
            return [];
        }
    }, []);

    // 邮箱验证码认证
    // 用于登录或注册
    const loginMemberWithEmail = useCallback(async (email: string, code: string) => {
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
            if (!res.data) return false;

            // ✅ 使用新的响应格式 { token }
            const { authToken,refreshToken } = res.data;
            login(authToken,refreshToken);

            return true;
        } catch {
            return false;
        }
    }, [login]);



    // 密码登录
    const loginMemberWithPassword = useCallback(async (email: string, password: string) => {
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
            if (!res.data) return false;

            // ✅ 使用新的响应格式 { user, token    }
            const { authToken,refreshToken } = res.data;
            login(authToken,refreshToken);

            return true;
        } catch {
            return false;
        }
    }, [login]);

    // 获取用户信息
    const fetchMemberProfile = useCallback(async () => {
        try {
            const res = await api.get(`/api/members/detail`);
            return res.data;
        } catch {
            return null;
        }
    }, []);

    const updateMemberProfile = useCallback(async (name: string, bio: string) => {
        try {
            await api.put(`/api/members/update`, {
                name: name.trim(),
                bio: bio.trim()
            });
            return true;
        } catch {
            return false;
        }
    }, []);

    // 上传照片
    const uploadPhoto = useCallback((title: string, description: string, file: File) => {
        void (async () => {
            try {
                const form = new FormData();
                form.append('file', file);
                form.append('title', title);
                form.append('description', description);
                // ✅ memberId已从JWT Token获取，无需从前端发送

                await api.post('/api/photos', form);

            } catch {
                return;
            }
        })();
        return true;
    }, []);
    
    const value = useMemo(() => ({
        loginMemberWithEmail,
        loginMemberWithPassword,
        updateMemberProfile,
        uploadPhoto,
        fetchPhotos,
        fetchOwnerPhotos,
        fetchMemberProfile
    }), [loginMemberWithEmail,
        loginMemberWithPassword,
        updateMemberProfile,
        uploadPhoto,
        fetchPhotos,
        fetchOwnerPhotos,
        fetchMemberProfile]);
    return (
    <FunctionContext.Provider value={value}>
        {children}
    </FunctionContext.Provider>
    );
};

// 3. 自定义 Hook，方便外部调用
export const useFunction = () => {
  const context = useContext(FunctionContext);
  if (!context) {
    throw new Error('useFunction must be used within a FunctionProvider');
  }
  return context;
};