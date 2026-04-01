import { createContext, ReactNode, useCallback, useContext, useMemo, useState} from 'react';


// 定义类型
interface TokenContextType {
    auth_token: string | null;
    setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
    login: (authToken: string) => void;
}
// 这个泛型定义可以避免一个ts错误，即在使用 useContext 时，如果上下文为空，会报错
const TokenContext = createContext<TokenContextType|null>(null);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
    const [auth_token, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken') || '');
    // 登录数据缓存
    const login = useCallback((authToken: string) => {
        // 分别保存到localStorage
        localStorage.setItem('authToken', authToken);

        setAuthToken((pre) => {
            if (pre === authToken) return pre; // 如果 token 没变，返回 pre，React 不会触发多余的渲染
            console.log('Token 从', pre, '更新为', authToken);
            return authToken;
        });
    }, []);
    
    const value = useMemo(() => ({
        auth_token, setAuthToken,login
    }), [auth_token, setAuthToken,login]);
    return (
    <TokenContext.Provider value={value}>
        {children}
    </TokenContext.Provider>
    );
};

// 3. 自定义 Hook，方便外部调用
export const useToken = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};