import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../context';
import { useUser } from '../context/user';
import api from '@/lib/axios';


export default function MemberRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), [normalizedEmail]);

  const reset = () => {
    setEmail('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setIsLoading(false);
    setStep('email');
  };
  useEffect(() => {
    if (user) {
      // 如果用户已登录，直接送回首页
      // 使用 replace: true 是为了防止用户点击浏览器返回键又回到登录页，形成死循环
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  const sendCode = async () => {
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post('/api/auth/request-register-code', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: normalizedEmail },
      });
      if (!res.data) throw new Error('send_failed');
      setStep('code');
    } catch {
      setError('验证码发送失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/auth/verify-code', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: normalizedEmail, code: code.trim() },
      });

      if (!res.data) {
        setError('验证码不正确或已过期');
        return;
      }

      // 验证码正确，进入密码设置步骤
      setStep('password');
    } catch {
      setError('验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const setPasswordAndComplete = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 设置密码
      const res = await api.post('/api/auth/set-password', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: normalizedEmail, password },
      });

      if (!res.data) {
        setError('密码设置失败');
        return;
      }

      // 密码设置成功，显示提示并延迟跳转
      showToast('密码设置成功！', 'success');

      // 延迟2秒后跳转到登录页
      setTimeout(() => {
        navigate('/member-auth?success=password_set');
      }, 2000);

    } catch {
      setError('注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
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
              <CardTitle>会员注册</CardTitle>
              <p className="text-sm text-muted-foreground">
                创建您的会员账户
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">邮箱地址</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void sendCode()}
                  disabled={!emailValid || isLoading}
                >
                  {isLoading ? '发送中...' : '发送验证码'}
                </Button>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registerCode">验证码</Label>
                  <Input
                    id="registerCode"
                    inputMode="numeric"
                    placeholder="6位数字"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    验证码已发送，请查收
                  </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('email')}
                  >
                    返回
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => void verifyCode()}
                    disabled={!code.trim() || isLoading}
                  >
                    {isLoading ? '验证中...' : '验证'}
                  </Button>
                </div>
              </>
            )}

            {step === 'password' && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">设置密码</h3>
                    <p className="text-sm text-muted-foreground">
                      验证码验证成功，请设置您的密码
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">密码</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="至少6位密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('code')}
                  >
                    返回
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => void setPasswordAndComplete()}
                    disabled={!password || !confirmPassword || isLoading}
                  >
                    {isLoading ? '注册中...' : '完成注册'}
                  </Button>
                </div>

                {/* 注册成功提示 */}
                {isLoading && (
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    注册成功，即将跳转到登录页面...
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate('/member-auth')}
              >
                已有账号？去登录
              </button>
            </div>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  reset();
                }}
              >
                重新开始
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}