import { User } from '@/types';
import { useState, useCallback, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 初始化时从localStorage恢复状态
  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('authToken');

      // 初始默认Token有效，恢复完整认证状态
      setUser(JSON.parse(savedUser || '{}'));
      setToken(savedToken || '');
    };

    initializeAuth();
  }, []);

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