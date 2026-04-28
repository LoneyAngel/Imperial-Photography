import { useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFunction } from '@/context/function';
import toast from 'react-hot-toast';
import {useCountdown} from '@/hooks/count';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { sendAuthCode, verifyCode } = useFunction();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSendTransition] = useTransition();
  const [verifying, startVerifyTransition] = useTransition();
  const { timeLeft, start, isCounting } = useCountdown(60);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const sendCode = () => {
    if (!emailValid) { setError('请输入有效的邮箱地址'); return; }
    startSendTransition(async () => {
      setError(null);
      setCode('');
      const err = await sendAuthCode(normalizedEmail);
      if (err) { toast.error(err.message); return; }
      start();
      setSent(true);
      toast.success('验证码已发送，请查收');
    });
  };

  const verifyAndReset = () => {
    if (!emailValid) { setError('请输入有效的邮箱地址'); return; }
    if (!sent) { setError('请先发送验证码'); return; }
    if (code.trim().length !== 6) { setError('请输入6位验证码'); return; }
    startVerifyTransition(async () => {
      setError(null);
      const err = await verifyCode(normalizedEmail, code);
      if (err) { toast.error(err.message); return; }
      toast.success('验证码验证成功，即将跳转重置密码页面');
    });
    const timer = setTimeout(() => {
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    }, 3000);
    return () => clearTimeout(timer);
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
                onClick={() => sendCode()}
                disabled={!emailValid || sending || isCounting}
              >
                {sending ? (
                  "发送中..."
                ) : isCounting ? (
                  `${timeLeft} 秒后重发`
                ) : sent ? (
                  "重新发送"
                ) : (
                  "发送验证码"
                )}
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => verifyAndReset()}
                disabled={!sent || !code.trim() || verifying}
              >
                {verifying ? '验证中...' : '验证'}
              </Button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:underline"
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