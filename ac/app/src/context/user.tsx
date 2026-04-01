import { createContext, ReactNode, useCallback, useContext, useMemo} from 'react';
import { QueryClient, QueryObserverResult, RefetchOptions, useQuery } from '@tanstack/react-query';
import { User } from '@/types';
import { useFunction } from './function';
import { useToken } from './token';

// 定义类型
interface UserContextType {
  user: User | null | undefined; // 建议换成具体的 User 类型
  isLoading: boolean;
  error: Error | null;
  // isAdmin: boolean;
  logout: () => void;
  refresh: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>;
  auth_token: string | null;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  login: (authToken: string) => void;
}
// 这个泛型定义可以避免一个ts错误，即在使用 useContext 时，如果上下文为空，会报错
const UserContext = createContext<UserContextType|null>(null);

export const UserProvider = ({ queryClient,children }: { queryClient: QueryClient, children: ReactNode }) => {
    const {auth_token, setAuthToken}= useToken();
    const { fetchMemberProfile } = useFunction();

    const login = useCallback((authToken: string) => {
        // 分别保存到localStorage
        localStorage.setItem('authToken', authToken);

        setAuthToken((pre) => {
            if (pre === authToken) return pre; // 如果 token 没变，返回 pre，React 不会触发多余的渲染
            console.log('Token 从', pre, '更新为', authToken);
            return authToken;
        });
    }, []);

    // 1. 使用 React Query 获取个人详情
    const { data: user, isLoading, error, refetch } = useQuery({
        queryKey: ['userMe', auth_token], // 加上 token 作为查询键的一部分，确保 token 变化时重新获取数据
        queryFn: fetchMemberProfile,
        staleTime: Infinity, // 个人详情不常变，设为永久新鲜直至手动刷新
        enabled: !!auth_token // 只有在有 token 时才执行查询 
    });

    // 2. 使用 useMemo 优化性能，只有当 user 或状态改变时才重新渲染 Provider 订阅者
    const value = useMemo(() => ({
        user,
        isLoading,
        error,
        auth_token, setAuthToken, login,
        // isAdmin: user?.role === 'admin', // 可以在这里封装便捷的权限判断
        logout: () => {
            localStorage.removeItem('authToken'); // 或你的清除逻辑
            queryClient.clear(); // 清除所有缓存，确保安全
            window.location.href = '/'; // 重定向
        },
        refresh: refetch
    }), [user, isLoading, error, refetch, auth_token]);

    return (
    <UserContext.Provider value={value}>
        {children}
    </UserContext.Provider>
    );
};

// 3. 自定义 Hook，方便外部调用
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};