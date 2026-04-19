import { createContext, ReactNode, use, useMemo, useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT } from '@/lib/axios';
import toast from 'react-hot-toast';

interface TokenContextType {
  auth_token: string | null;
  role: number | null;
  isLoading: boolean;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  login: (authToken: string, roleId: number) => void;
  logout: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [auth_token, setAuthToken] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 应用初始化时尝试刷新 token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post('/api/auth/refresh');
        if (res.data?.data?.authToken) {
          setAuthToken(res.data.data.authToken);
          setRole(res.data.data.roleId ?? null);
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
    const handleTokenRefresh = (e: CustomEvent<{ authToken: string; roleId?: number }>) => {
      setAuthToken(e.detail.authToken);
      if (e.detail.roleId !== undefined) {
        setRole(e.detail.roleId);
      }
    };
    window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
    return () => {
      window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh as EventListener);
    };
  }, []);

  const logout = async () => {
    setAuthToken(null);
    setRole(null);
    localStorage.removeItem('userRole');
    await api.post('/api/auth/logout').catch(() => {
        toast.error('退出登录失败，请稍后再试');
    }).finally(() => {
        console.log('Logged out, redirecting to home');
        window.location.href = '/';
    });
  };

  const login = (authToken: string, roleId: number) => {
    setAuthToken(authToken);
    setRole(roleId);
  };

  const value = useMemo(() => ({
    auth_token, role, isLoading, setAuthToken, login, logout
  }), [auth_token, role, isLoading, login, logout]);

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