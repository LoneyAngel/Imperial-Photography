import { User } from '@/types';
import { useState, useCallback, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Token过期检查
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }, []);

  // 初始化时从localStorage恢复状态
  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('authToken');

      if (savedUser && savedToken) {
        if (isTokenExpired(savedToken)) {
          // Token过期，清除认证状态但保留用户信息用于快速重新登录
          setUser(JSON.parse(savedUser));
          setToken(null);
          localStorage.removeItem('authToken');
        } else {
          // Token有效，恢复完整认证状态
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      }
    };

    initializeAuth();
  }, [isTokenExpired]);

  // 登录数据缓存
  const login = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);

    // 分别保存到localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authToken', authToken);
  }, []);

  // 登出清除缓存
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    // 清除localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }, []);

  // 更新用户信息
  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  // 认证状态
  const isAuthenticated = !!user && !!token;

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };
}