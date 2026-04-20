import { useState, useTransition } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFunction } from '@/context/function';
import toast from 'react-hot-toast';

export default function MemberAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 检查是否有 success 参数，并根据其值显示相应的消息,可能是 "password_set" 或 "password_reset"
  const successMessage = searchParams.get('success');

  const goHome = () => navigate('/');

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex items-center">
              <button
                type="button"
                onClick={goHome}
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
                <CodeLoginForm onDone={goHome} />
              </TabsContent>

              <TabsContent value="password">
                <PasswordLoginForm onDone={goHome} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 验证码登录表单
function CodeLoginForm({ onDone }: { onDone: () => void }) {
  const { loginMemberWithEmail,sendAuthCode } = useFunction();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const [isPending, startTransition] = useTransition();

  

  const reset = () => {
    setEmail('');
    setCode('');
    setSent(false);
    setError(null);
    setVerifying(false);
  };

  const send = async () => {
    if (!emailValid()) {
      setError('请输入有效的邮箱地址');
      return;
    }
    startTransition(async () => {
      setError(null);
      const res = await sendAuthCode(normalizedEmail);
      if(res){
        toast.error(res.message);
        return;
      }
      setSent(true);
      toast.success('验证码已发送，请查收');
    });
  };

  const verifyCodeAndLogin = async () => {
    if (!emailValid()) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!sent) {
      setError('还没有发送验证码');
      return;
    }
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const ok = await loginMemberWithEmail(normalizedEmail, code.trim());
      if (ok) {
        reset();
        onDone();
        toast.success('登录成功');
      } else {
        toast.error('登录失败');
      }
    } catch {
      toast.error('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };


  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberEmail">邮箱</Label>
        <Input
          id="email"
          name='email'
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => void send()}
          disabled={isPending}
        >
          {isPending ? '发送中...' : '发送验证码'}
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

      <Link to="/register" className='block w-full text-center text-[12px] text-gray-500 '>
        <span className='border-b-[1px] hover:border-gray-500'>
          没有账号？注册
        </span>
      </Link>
    </form>
  );
}

// 密码登录表单
function PasswordLoginForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {loginMemberWithPassword} = useFunction();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);

    try {
      const success = await loginMemberWithPassword(email.trim().toLowerCase(), password);
      if (success) {
        toast.success('登录成功');
        onDone();
      }
    } catch (err) {
      toast.error('登录失败，请重试');
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
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </Button>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline text-center w-full"
          onClick={() => navigate('/forgot-password')}
        >
          忘记密码？
        </button>
      </div>
    </form>
  );
}