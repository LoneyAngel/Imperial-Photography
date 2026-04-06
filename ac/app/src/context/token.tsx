import { queryClient } from '@/App';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT } from '@/lib/axios';

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

    // 应用初始化时尝试刷新 token
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await api.post('/api/auth/refresh');
                if (res.data?.authToken) {
                    setAuthToken(res.data.authToken);
                    // 清除可能存在的临时 localStorage
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                }
            } catch {
                // refresh 失败，用户未登录或 token 已过期
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
        };
        window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
        return () => {
            window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
        };
    }, []);

    const logout = useCallback(() => {
        setAuthToken(null);
        queryClient.clear();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
    }, []);

    const login = useCallback((authToken: string) => {
        setAuthToken((pre) => {
            if (pre === authToken) return pre;
            console.log('Token 从', pre, '更新为', authToken);
            return authToken;
        });
    }, []);

    const value = useMemo(() => ({
        auth_token, isLoading, setAuthToken, login, logout
    }), [auth_token, isLoading, setAuthToken, login, logout]);

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