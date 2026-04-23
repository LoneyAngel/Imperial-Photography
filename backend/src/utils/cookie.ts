// Cookie 配置
const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 24 * 60 * 60 * 1000, // 15天
  path: '/',
};

// 设置 refreshToken 到 cookie
function setRefreshTokenCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// 清除 refreshToken cookie
function clearRefreshTokenCookie(res: any) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}
export { setRefreshTokenCookie, clearRefreshTokenCookie };