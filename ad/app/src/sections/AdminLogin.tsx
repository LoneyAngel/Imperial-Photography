import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/context';
import { useAdminFunction } from '@/context/function';
import { useToken } from '@/context/token';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loginAdmin } = useAdminFunction();
  const { login } = useToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('请输入邮箱和密码', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginAdmin(email.trim().toLowerCase(), password);
      if (result) {
        login(result.authToken, result.refreshToken, result.roleId);
        showToast('登录成功', 'success');
        navigate('/users');
      } else {
        showToast('登录失败，请检查账号密码', 'error');
      }
    } catch {
      showToast('登录失败，请重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            管理员登录
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            后台管理系统
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}