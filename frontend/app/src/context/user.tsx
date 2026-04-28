import { createContext, ReactNode, use } from 'react';
import { User } from '@/types';
import { useFunction } from './function';
import { useToken } from './token';
import { QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';

interface UserContextType {
  user: User | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { auth_token } = useToken();
  const { fetchMemberProfile } = useFunction();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userMe', auth_token],
    queryFn: fetchMemberProfile,
    staleTime: Infinity,
    enabled: !!auth_token,
  });

  const value = {
    user,
    isLoading,
    error,
    refresh: refetch,
  };

  return <UserContext value={value}>{children}</UserContext>;
};

export const useUser = () => {
  const context = use(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
