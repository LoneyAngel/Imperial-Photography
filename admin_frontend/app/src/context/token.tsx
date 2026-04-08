import { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT } from '@/lib/axios';

interface TokenContextType {
  auth_token: string | null;
  role: number | null;
  isLoading: boolean;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  login: (authToken: string, roleId: number) => void;
  logout: () => void;
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
        if (res.data?.authToken) {
          setAuthToken(res.data.authToken);
          setRole(res.data.roleId ?? null);
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

  const logout = useCallback(() => {
    setAuthToken(null);
    setRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  }, []);

  const login = useCallback((authToken: string, roleId: number) => {
    setAuthToken(authToken);
    setRole(roleId);
  }, []);

  const value = useMemo(() => ({
    auth_token, role, isLoading, setAuthToken, login, logout
  }), [auth_token, role, isLoading, login, logout]);

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