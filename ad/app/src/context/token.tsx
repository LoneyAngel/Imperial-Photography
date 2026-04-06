import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface TokenContextType {
  auth_token: string | null;
  role: number | null;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  login: (authToken: string, refreshToken: string, roleId: number) => void;
  logout: () => void;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [auth_token, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken') || null);
  const [role, setRole] = useState<number | null>(() => {
    const storedRole = localStorage.getItem('userRole');
    return storedRole ? parseInt(storedRole, 10) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    setAuthToken(null);
    setRole(null);
    window.location.href = '/login';
  }, []);

  const login = useCallback((authToken: string, refreshToken: string, roleId: number) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userRole', String(roleId));
    setAuthToken(authToken);
    setRole(roleId);
  }, []);

  const value = useMemo(() => ({
    auth_token, role, setAuthToken, login, logout
  }), [auth_token, role, login, logout]);

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