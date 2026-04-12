import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '../context/user';
import api from '@/utils/axios';
import toast from 'react-hot-toast';


export default function MemberRegister() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
    setAgreedToPrivacy(false);
  };
  useEffect(() => {
    if (user) {
      // 如果用户已登录，直接送回首页
      // 使用 replace: true 是为了防止用户点击浏览器返回键又回到登录页，形成死循环
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  const sendCode = async () => {
    if (!agreedToPrivacy) {
      setError('请先阅读并同意隐私协议');
      return;
    }
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post('/api/auth/request-register-code', 
        { email: normalizedEmail },{
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
      const res = await api.post('/api/auth/verify-code',
        { email: normalizedEmail, code: code.trim() }, {
        headers: { 'Content-Type': 'application/json' },
        }
      );

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
      const res = await api.post('/api/auth/set-password',{ email: normalizedEmail, password }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.data) {
        setError('密码设置失败');
        return;
      }

      // 密码设置成功，显示提示并延迟跳转
      toast.success('密码设置成功！');

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

                {/* 隐私协议勾选 */}
                <div className="flex items-start gap-2">
                  <input
                    id="privacy"
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="privacy" className="text-sm text-muted-foreground leading-snug">
                    我已阅读并同意
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-gray-600 hover:underline mx-1"
                    >
                      《隐私协议》
                    </button>
                  </label>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void sendCode()}
                  disabled={!emailValid || !agreedToPrivacy || isLoading}
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
                className="text-sm text-gray-500 underline decoration-gray-500 decoration-1 underline-offset-4 decoration-dashed hover:decoration-gray-700 hover:text-gray-800"
                onClick={() => navigate('/member-auth')}
              >
                已有账号？去登录
              </button>
            </div>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                className="text-sm text-gray-500 underline decoration-gray-500 decoration-1 underline-offset-4 decoration-dashed hover:decoration-gray-700 hover:text-gray-800"
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

      {/* 隐私协议弹窗 */}
      {showPrivacy && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPrivacy(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">隐私协议</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-muted-foreground space-y-4 leading-relaxed">
              <p>最后更新日期：2025年</p>
              <p>欢迎使用 Imperial Photography（以下简称“本平台”）。在注册前，请仔细阅读本隐私协议。</p>
              <div>
                <p className="font-medium text-foreground mb-1">1. 收集的信息</p>
                <p>我们仅收集您的邮箱地址、个人名称、个人简介及您主动上传的照片作品。</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">2. 信息用途</p>
                <p>您的信息仅用于身份验证、展示作品及提供平台服务，不会向第三方出售或共享您的个人信息。</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. 作品权利</p>
                <p>您上传的照片作品的着作权归您所有。本平台仅展示您的作品，不会将其用于商业目的。</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">4. 数据安全</p>
                <p>我们采用合理的安全措施保护您的个人信息，包括加密存储和传输。</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">5. 联系我们</p>
                <p>如您对本协议有任何疑问，请通过平台内的联系方式与我们取得联系。</p>
              </div>
            </div>
            <div className="p-4 border-t">
              <Button className="w-full" onClick={() => { setAgreedToPrivacy(true); setShowPrivacy(false); }}>
                我已阅读并同意
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}