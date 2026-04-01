import { createContext, ReactNode, useCallback, useContext, useMemo} from 'react';
import { Photo, User } from '@/types';
import { queryClient } from '@/App';
import { useToken } from './token';

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
    const { auth_token, login} = useToken(); 
    
    // 为API Fetch附上token
    const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = {
            ...init?.headers,
            ...(auth_token && {
                Authorization: `Bearer ${auth_token}`
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
                localStorage.removeItem('authToken'); // 或你的清除逻辑
                window.location.href = '/login'; // 重定向
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
    }, [auth_token]);

    // 获取所有照片
    const fetchPhotos = useCallback(async () => {
        try {
            const res = await fetch('/api/photos');
            const data = (await res.json()) as Photo[];
            return data;
        } catch {
            return [];
        }
    }, [apiFetch]);

    // 获取用户所有照片
    const fetchOwnerPhotos = useCallback(async (id: string) => {
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
        return [];
    }, [apiFetch]);

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

            // ✅ 使用新的响应格式 { token }
            const { token } = await res.json();
            login(token); 

            return true;
        } catch {
            return false;
        }
    }, [apiFetch, login, queryClient]);



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
            const { token } = await res.json();
            login(token); 

            // 触发用户数据刷新
            queryClient.invalidateQueries({ queryKey: ['userMe'] });

            return true;
        } catch {
            return false;
        }
    }, [apiFetch, login, queryClient]);

    // // 登出
    // const logoutMember = useCallback(() => {
    //   logout(); 
    // }, [logout]);

    // 获取用户信息
    const fetchMemberProfile = useCallback(async () => {
        try {
            const res = await apiFetch(`/api/members/detail`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const member = await res.json();
            return member;
        } catch {
            return null;
        }
    }, [apiFetch, auth_token]);

    const updateMemberProfile = useCallback(async (name: string, bio: string) => {
        try {
            await apiFetch(`/api/members/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
            });
            return true;
        } catch {
            return false;
        }
    }, [apiFetch]);

    // 上传照片
    const uploadPhoto = useCallback((title: string, description: string, file: File) => {
        void (async () => {
            try {
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
    }, [apiFetch]);
    
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