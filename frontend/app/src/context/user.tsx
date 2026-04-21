import { createContext, ReactNode, use} from 'react';
import { User } from '@/types';
import { useFunction } from './function';
import { useToken } from './token';
import { QueryClient, QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';

// 定义类型
interface UserContextType {
  user: User | null | undefined; // 建议换成具体的 User 类型
  isLoading: boolean;
  error: Error | null;
  // isAdmin: boolean;
  refresh: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>;
}
// 这个泛型定义可以避免一个ts错误，即在使用 useContext 时，如果上下文为空，会报错
const UserContext = createContext<UserContextType|null>(null);

export const UserProvider = ({ children }: { queryClient: QueryClient, children: ReactNode }) => {
    const {auth_token}= useToken();
    const { fetchMemberProfile } = useFunction();

    // 1. 使用 React Query 获取个人详情
    const { data: user, isLoading, error, refetch } = useQuery({
        queryKey: ['userMe', auth_token], // 加上 token 作为查询键的一部分，确保 token 变化时重新获取数据
        queryFn: fetchMemberProfile,
        staleTime: Infinity, // 个人详情不常变，设为永久新鲜直至手动刷新
        enabled: !!auth_token // 只有在有 token 时才执行查询 
    });

    // 2. 使用 useMemo 优化性能，只有当 user 或状态改变时才重新渲染 Provider 订阅者
    const value = {
        user,
        isLoading,
        error,
        // isAdmin: user?.role === 'admin', // 可以在这里封装便捷的权限判断
        refresh: refetch,
    };

    return (
    <UserContext value={value}>
        {children}
    </UserContext>
    );
};

// 3. 自定义 Hook，方便外部调用
export const useUser = () => {
  const context = use(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};