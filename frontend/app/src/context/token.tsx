import { queryClient } from '@/App';
import { createContext, ReactNode, use, useState, useEffect } from 'react';
import api, { TOKEN_REFRESHED_EVENT, setMemoryToken } from '@/utils/axios';
import toast from 'react-hot-toast';

interface TokenContextType {
  auth_token: string | null;
  isLoading: boolean;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  login: (authToken: string) => void;
  logout: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [auth_token, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.data?.authToken) {
          setAuthToken(res.data.data.authToken);
          setMemoryToken(res.data.data.authToken);
        }
      } catch {
        setMemoryToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    void initAuth();
  }, []);

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
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API failed', err);
    } finally {
      setAuthToken(null);
      setMemoryToken(null);
      queryClient.clear();
      toast.success('已安全退出');
      window.location.href = '/';
    }
  };

  const login = (authToken: string) => {
    setAuthToken(authToken);
    setMemoryToken(authToken);
  };

  const value = { auth_token, isLoading, setAuthToken, login, logout };

  return <TokenContext value={value}>{children}</TokenContext>;
};

export const useToken = () => {
  const context = use(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};
