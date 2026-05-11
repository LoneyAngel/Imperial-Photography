import { useState, useTransition } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFunction } from '@/context/function';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useCountdown } from '@/hooks/count';

export default function MemberAuth() {
  const [searchParams] = useSearchParams();
  // 检查是否有 success 参数，并根据其值显示相应的消息,可能是 "password_set" 或 "password_reset"
  const successMessage = searchParams.get('success');

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <Link to="/" className="flex items-center">
              <span className="text-sm text-black hover:underline mr-2">← 返回</span>
            </Link>
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
                <CodeLoginForm />
              </TabsContent>

              <TabsContent value="password">
                <PasswordLoginForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 验证码登录表单
function CodeLoginForm() {
  const navigate = useNavigate();
  const { verifyCode, sendAuthCode } = useFunction();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const [isCode, startAuthCodeTransition] = useTransition();
  const [isVerify, startVerifyTransition] = useTransition();
  const { timeLeft, start, isCounting } = useCountdown(60);
  let timer: NodeJS.Timeout;

  const reset = () => {
    setEmail('');
    setCode('');
    setSent(false);
    setError(null);
  };

  const send = async () => {
    console.log('发送验证码给', normalizedEmail);
    console.log('邮箱格式是否有效', emailValid());
    if (!emailValid()) {
      setError('请输入有效的邮箱地址');
      return;
    }
    startAuthCodeTransition(async () => {
      setError(null);
      const res = await sendAuthCode(normalizedEmail);
      if (res) {
        toast.error(res.message);
        return;
      }
      start();
      setSent(true);
      toast.success('验证码已发送，请查收');
    });
  };

  const verifyCodeAndLogin = async () => {
    setError(null);
    if (!emailValid()) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!sent) {
      toast.error('还没有发送验证码');
      return;
    }
    if (!code.trim()) {
      setError('验证码为空');
      return;
    }
    startVerifyTransition(async () => {
      const res = await verifyCode(normalizedEmail, code.trim());
      if (res) {
        toast.error(res.message || '登录失败，请检查验证码后重试');
        return;
      }
      toast.success('登录成功');
    });
    reset();
    timer = setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberEmail">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>
      <div className={`space-y-2 transition-all duration-500`}>
        <Label htmlFor="authCode">验证码</Label>
        <Input
          id="authCode"
          name="code"
          type="text"
          placeholder="请发送验证码"
          maxLength={6}
          value={code}
          disabled={!sent} // 没发送前禁止输入，防止用户盲填
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          className="tracking-[0.5em] font-mono text-center" // 艺术感：等宽字体+间距，方便输入数字
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => void send()}
          disabled={isCode || !emailValid() || isCounting}
        >
          {isCode
            ? '发送中...'
            : isCounting
              ? `${timeLeft} 秒后重发`
              : sent
                ? '重新发送'
                : '发送验证码'}
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => void verifyCodeAndLogin()}
          disabled={!sent || !code.trim() || isVerify}
        >
          {isVerify ? '登录中...' : '登录'}
        </Button>
      </div>

      <Link to="/register" className="block w-full text-center text-[12px] text-gray-500 ">
        <span className="border-b-[1px] hover:border-gray-500">没有账号？注册</span>
      </Link>
    </form>
  );
}

// 密码登录表单
function PasswordLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginMemberWithPassword } = useFunction();
  const [isLogining, loginTransition] = useTransition();
  const navigate = useNavigate();
  let timer: NodeJS.Timeout;
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    loginTransition(async () => {
      const a = await loginMemberWithPassword(email.trim().toLowerCase(), password);
      if (a) {
        toast.error(a.message || '登录失败，请检查邮箱和密码后重试');
        return;
      } else {
        toast.success('登录成功');
      }
    });
    timer = setTimeout(() => {
      navigate('/');
    }, 2000); // 2秒后跳转
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loginEmail">邮箱</Label>
        <Input
          id="loginEmail"
          type="email"
          placeholder="name@example.com"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loginPassword">密码</Label>
        <div className="relative">
          <Input
            id="loginPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="请输入密码"
            name="password"
            className="pr-10"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1} // 防止 Tab 键切换到这个按钮，优化输入体验
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLogining}>
        {isLogining ? '登录中...' : '登录'}
      </Button>

      <Link to="/forgot-password" className="block w-full text-center text-[12px] text-gray-500">
        <span className="border-b-[1px] hover:border-gray-500">忘记密码？</span>
      </Link>
      <Link to="/register" className="block w-full text-center text-[12px] text-gray-500 ">
        <span className="border-b-[1px] hover:border-gray-500">没有账号？注册</span>
      </Link>
    </form>
  );
}
