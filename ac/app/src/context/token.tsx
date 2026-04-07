import { queryClient } from '@/App';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT, setMemoryToken } from '@/lib/axios';

// 定义类型
interface TokenContextType {
    auth_token: string | null;
    isLoading: boolean; // 初始化加载状态
    setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
    login: (authToken: string) => void;
    logout: () => void;
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
                if (res.data?.authToken) {
                    setAuthToken(res.data.authToken);
                    setMemoryToken(res.data.authToken);
                }
            } catch {
                // refresh 失败，用户未登录或 token 已过期
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

    const logout = useCallback(() => {
        setAuthToken(null);
        setMemoryToken(null);
        queryClient.clear();
        void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
    }, []);

    const login = useCallback((authToken: string) => {
        setAuthToken((pre) => {
            if (pre === authToken) return pre;
            return authToken;
        });
        setMemoryToken(authToken);
    }, []);

    const value = useMemo(() => ({
        auth_token, isLoading, setAuthToken, login, logout
    }), [auth_token, isLoading, login, logout]);

    return (
        <TokenContext.Provider value={value}>
            {children}
        </TokenContext.Provider>
    );
};

export const useToken = () => {
    const context = useContext(TokenContext);
    if (!context) {
        throw new Error('useToken must be used within a TokenProvider');
    }
    return context;
};