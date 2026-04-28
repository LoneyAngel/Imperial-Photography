import { useState, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useFunction } from '@/context/function';
import toast from 'react-hot-toast';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const { set_password } = useFunction();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('邮箱为空');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    startTransition(async () => {
      const err = await set_password(email, password);
      if (err) {
        toast.error(err.message);
        return;
      }
      toast.success('设置成功');
      navigate('/member-auth?success=password_set');
    });
  };

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <div className="text-center space-y-1">
              <CardTitle>设置密码</CardTitle>
              <p className="text-sm text-muted-foreground">为邮箱 {email} 设置登录密码</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="请输入密码（至少6位）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    name="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? '设置中...' : '设置密码'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
