import { useEffect, useState, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '../context/user';
import toast from 'react-hot-toast';
import { useFunction } from '@/context/function';
import { useCountdown } from '@/hooks/count';

export default function MemberRegister() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isSending, sendCodeTransition] = useTransition();
  const [isVerifying, verifyCodeTransition] = useTransition();
  const [isSettingPassword, setPasswordTransition] = useTransition();
  const { timeLeft, start, isCounting } = useCountdown(60);
  const { sendRegisterCode, verifyCode, set_password } = useFunction();
  const normalizedEmail = () => email.trim().toLowerCase();
  const emailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail());

  const reset = () => {
    setEmail('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setStep('email');
    setAgreedToPrivacy(false);
    setSent(false);
  };

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user]);

  const sendCode = async () => {
    setError(null);
    if (!agreedToPrivacy) {
      setError('请先阅读并同意隐私协议');
      return;
    }
    if (!emailValid()) {
      setError('请输入有效的邮箱地址');
      return;
    }
    sendCodeTransition(async () => {
      const res = await sendRegisterCode(normalizedEmail());
      if (res) {
        toast.error(res.message || '验证码发送失败，请重试');
        return;
      }
      start();
      setSent(true);
      setStep('code');
    });
  };

  const verify_Code = async () => {
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }
    setError(null);
    verifyCodeTransition(async () => {
      const res = await verifyCode(normalizedEmail(), code.trim());
      if (res) {setError(res.message || '验证码验证失败，请检查后重试');return;}
      setStep('password');
    });
  };

  const setPasswordAndComplete = async () => {
    setError(null);
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
    setPasswordTransition(async () => {
      const res = await set_password(normalizedEmail(), password);
      if (res) {toast.error(res.message || '注册失败，请重试');return;}
      toast.success('密码设置成功！');
      setTimeout(() => {navigate('/member-auth?success=password_set');}, 2000);
    });
  };

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <Link to="/member-auth" className="flex items-center">
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
              <CardTitle>会员注册</CardTitle>
              <p className="text-sm text-muted-foreground">创建您的会员账户</p>
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
                  disabled={!emailValid || !agreedToPrivacy || isSending}
                >
                  {isSending ? (
                    '发送中...'
                  ) : isCounting ? (
                    `${timeLeft} 秒后重发`
                  ) : sent ? (
                    '重新发送'
                  ) : (
                    '发送验证码'
                  )}
                </Button>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registerCode">验证码</Label>                    <Input
                    id="registerCode"
                    inputMode="numeric"
                    placeholder="6位数字"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">验证码已发送，请查收</p>
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
                    onClick={() => void verify_Code()}
                    disabled={!code.trim() || isVerifying}
                  >
                    {isVerifying ? '验证中...' : '验证'}
                  </Button>
                </div>
              </>
            )}

            {step === 'password' && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">设置密码</h3>
                    <p className="text-sm text-muted-foreground">验证码验证成功，请设置您的密码</p>
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
                    disabled={!password || !confirmPassword || isSettingPassword}
                  >
                    {isSettingPassword ? '注册中...' : '完成注册'}
                  </Button>
                </div>

                {isSettingPassword && (
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
                onClick={() => reset()}
              >
                重新开始
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPrivacy && (
        <PrivacyDiv
          setShowPrivacy={setShowPrivacy}
          setAgreedToPrivacy={setAgreedToPrivacy}
        />
      )}
    </div>
  );
}

const PrivacyDiv = ({
  setShowPrivacy,
  setAgreedToPrivacy,
}: {
  setShowPrivacy: (show: boolean) => void;
  setAgreedToPrivacy: (agreed: boolean) => void;
}) => {
  return (
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
          <button
            onClick={() => setShowPrivacy(false)}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
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
            <p>您上传的照片作品的著作权归您所有。本平台仅展示您的作品，不会将其用于商业目的。</p>
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
          <Button
            className="w-full"
            onClick={() => {
              setAgreedToPrivacy(true);
              setShowPrivacy(false);
            }}
          >
            我已阅读并同意
          </Button>
        </div>
      </div>
    </div>
  );
};
