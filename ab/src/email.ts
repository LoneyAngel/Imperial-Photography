import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getVerificationSecret() {
  const secret = process.env.VERIFICATION_CODE_SECRET;
  if (secret && secret.trim()) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('missing_verification_secret');
  }
  return 'dev-secret';
}

export function hashVerificationCode(email: string, code: string) {
  const secret = getVerificationSecret();
  const input = `${normalizeEmail(email)}:${code}:${secret}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  expiresMinutes: number;
}) {
  const to = normalizeEmail(params.to);

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  const hasSmtp = Boolean(host && port && user && pass);

  if (!hasSmtp) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('smtp_not_configured');
    }
    console.log(`[verification-code] ${to} ${params.code}`);
    return;
  }

  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const fromValue = from
    ? from.includes('@')
      ? from
      : `${from} <${user}>`
    : user!;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: fromValue,
    to,
    subject: '【Imperial摄影】邮箱验证码',
    text: `尊敬的Imperial摄影会员：\n\n感谢您使用Imperial摄影平台！\n\n您的邮箱验证码为：${params.code}\n\n验证码有效期为 ${params.expiresMinutes} 分钟，请及时完成验证。\n\n如非本人操作，请忽略此邮件。\n\n此致\nImperial摄影团队\n\n---\n此为系统邮件，请勿回复`,
  });
}
