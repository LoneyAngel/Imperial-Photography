import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { Member } from '@/types';

interface MemberAuthProps {
  currentMember: Member | null;
  onLogin: (email: string, code: string) => Promise<boolean>;
  onPasswordLogin: (email: string, password: string) => Promise<boolean>;
  onLogout: () => void;
}

export default function MemberAuth({ currentMember, onLogin, onPasswordLogin, onLogout }: MemberAuthProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const successMessage = searchParams.get('success');

  const handleDone = () => {
    navigate('/');
  };

  if (currentMember) {
    return (
      <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
        <div className="w-full max-w-md">
          <Card className="shadow-sm border border-slate-200">
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm text-muted-foreground">当前已登录</p>
                <p className="text-sm font-medium break-words">{currentMember.email}</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleDone}>
                  返回网站
                </Button>
                <Button className="flex-1" variant="outline" onClick={onLogout}>
                  退出登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleDone}
                className="text-sm text-blue-600 hover:underline mr-2"
              >
                ← 返回
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-3xl font-semibold tracking-tight">
                <span className="text-blue-600">I</span>
                <span className="text-red-500">m</span>
                <span className="text-yellow-500">p</span>
                <span className="text-blue-600">e</span>
                <span className="text-green-600">r</span>
                <span className="text-red-500">i</span>
                <span className="text-blue-600">a</span>
                <span className="text-green-600">l</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-medium">会员登录</h1>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm text-green-800">
                  {successMessage === 'password_set' && '密码设置成功！'}
                  {successMessage === 'password_reset' && '密码重置成功！'}
                </p>
              </div>
            )}

            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">验证码登录</TabsTrigger>
                <TabsTrigger value="password">密码登录</TabsTrigger>
              </TabsList>

              <TabsContent value="code">
                <CodeLoginForm onLogin={onLogin} onDone={handleDone} />
              </TabsContent>

              <TabsContent value="password">
                <PasswordLoginForm onDone={handleDone} onPasswordLogin={onPasswordLogin} />
              </TabsContent>
            </Tabs>


          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CodeLoginForm({ onLogin, onDone }: { onLogin: (email: string, code: string) => Promise<boolean>; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), [normalizedEmail]);

  const reset = () => {
    setEmail('');
    setCode('');
    setSent(false);
    setError(null);
    setSending(false);
    setVerifying(false);
  };

  const sendCode = async () => {
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }
    try {
      setSending(true);
      setError(null);
      setCode('');
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      if (!res.ok) throw new Error('send_failed');
      setSent(true);
    } catch {
      setError('验证码发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const verifyCodeAndLogin = async () => {
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!sent) {
      setError('请先发送验证码');
      return;
    }
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: code.trim() }),
      });

      if (!res.ok) {
        setError('验证码不正确或已过期');
        return;
      }

      // 验证码正确，直接登录
      const ok = await onLogin(normalizedEmail, code.trim());
      if (ok) {
        reset();
        onDone();
      } else {
        setError('登录失败');
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberEmail">邮箱</Label>
        <Input
          id="memberEmail"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {sent && (
        <div className="space-y-2">
          <Label htmlFor="memberCode">验证码</Label>
          <Input
            id="memberCode"
            inputMode="numeric"
            placeholder="6位数字"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            验证码已发送至 {normalizedEmail}，请查收
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => void sendCode()}
          disabled={!emailValid || sending}
        >
          {sending ? '发送中...' : '发送验证码'}
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => void verifyCodeAndLogin()}
          disabled={!sent || !code.trim() || verifying}
        >
          {verifying ? '登录中...' : '登录'}
        </Button>
      </div>

      <Link to="/member-register" className='block w-full text-center text-[12px] text-gray-500 '>
        <span className='border-b-[1px] hover:border-gray-500'>
          没有账号？注册
        </span>
      </Link>
    </div>
  );
}

function PasswordLoginForm({ onDone, onPasswordLogin }: { onDone: () => void; onPasswordLogin: (email: string, password: string) => Promise<boolean> }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error === 'invalid_credentials' ? '邮箱或密码错误' : '登录失败');
        return;
      }

      const success = await onPasswordLogin(email.trim().toLowerCase(), password);
      if (success) {
        onDone();
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loginEmail">邮箱</Label>
        <Input
          id="loginEmail"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loginPassword">密码</Label>
        <div className="relative">
          <Input
            id="loginPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </Button>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => navigate('/forgot-password')}
        >
          忘记密码？
        </button>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => navigate('/set-password')}
        >
          设置密码
        </button>
      </div>
    </form>
  );
}