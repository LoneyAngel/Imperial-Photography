import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), [normalizedEmail]);
  
  const sendCode = async () => {
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setCode('');

      const res = await api.post('/api/auth/request-reset-code', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: normalizedEmail },
      });

      if (!res.data) {
        if (res.data.error === 'no_password') {
          setError('该邮箱未设置密码，请使用验证码登录');
        } else {
          throw new Error('send_failed');
        }
        return;
      }

      setSent(true);
    } catch (err) {
      setError('验证码发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const verifyAndReset = async () => {
    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (!sent) {
      setError('请先发送验证码');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await api.post('/api/auth/verify-reset-code', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: normalizedEmail, code: code.trim() },
      });

      if (!res.data) {
        setError(res.data.error === 'invalid_code' ? '验证码不正确或已过期' : '验证失败');
        return;
      }

      // 验证成功，跳转到设置新密码页面
      const token = res.data.token;
      navigate(`/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="space-y-3">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-medium">重置密码</h1>
              <p className="text-sm text-muted-foreground">
                输入您的邮箱地址，我们将发送验证码来重置密码
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">邮箱</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {sent && (
              <div className="space-y-2">
                <Label htmlFor="resetCode">验证码</Label>
                <Input
                  id="resetCode"
                  inputMode="numeric"
                  placeholder="6位数字"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  验证码已发送至邮箱，请查收
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
                {sending ? '发送中...' : sent ? '重新发送' : '发送验证码'}
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void verifyAndReset()}
                disabled={!sent || !code.trim() || verifying}
              >
                {verifying ? '验证中...' : '验证'}
              </Button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate('/member-auth')}
              >
                返回登录
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}