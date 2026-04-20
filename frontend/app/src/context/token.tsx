import { queryClient } from '@/App';
import { createContext, ReactNode, use,useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT, setMemoryToken } from '@/utils/axios';
import toast from 'react-hot-toast';

// 定义类型
interface TokenContextType {
    auth_token: string | null;
    isLoading: boolean; // 初始化加载状态
    setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
    login: (authToken: string) => void;
    logout: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
    const [auth_token, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 应用初始化时用 refreshToken 获取 authToken
    // refreshToken 在 HttpOnly Cookie 中，页面刷新后仍可用
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await api.post('/api/auth/refresh');
                if (res.data?.data?.authToken) {
                    setAuthToken(res.data.data.authToken);
                    setMemoryToken(res.data.data.authToken);
                }
            } catch {
                // refresh 失败，用户未登录或 cookie 已过期
                setMemoryToken(null);
            } finally {
                setIsLoading(false);
            }
        };
        void initAuth();
    }, []);

    // 监听 axios 拦截器的 token 刷新事件
    useEffect(() => {
        const handleTokenRefresh = (e: CustomEvent<{ authToken: string }>) => {
            setAuthToken(e.detail.authToken);
            setMemoryToken(e.detail.authToken);
        };
        window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
        return () => {
            window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
        };
    }, []);

    const logout = async () => {
        setAuthToken(null);
        setMemoryToken(null);
        queryClient.clear();
        await api.post('/api/auth/logout').catch(() => {
            toast.error('退出登录失败，请稍后再试');
        }).finally(() => {
            console.log('Logged out, redirecting to home');
            window.location.href = '/';
        });
    };

    const login = (authToken: string) => {
        setAuthToken((pre) => {
            if (pre === authToken) return pre;
            return authToken;
        });
        setMemoryToken(authToken);
    };

    const value = {
        auth_token, isLoading, setAuthToken, login, logout
    };

    return (
        <TokenContext value={value}>
            {children}
        </TokenContext>
    );
};

export const useToken = () => {
    const context = use(TokenContext);
    if (!context) {
        throw new Error('useToken must be used within a TokenProvider');
    }
    return context;
};