import './env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errors.js';

// 导入路由
import authRoutes from './router/auth.js';
import photoRoutes from './router/photos.js';
import memberRoutes from './router/members.js';
import noticeRoutes from './router/notice.js';
import adminRoutes from './router/admin/index.js';

const PORT = Number(process.env.PORT ?? '4001');
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// CORS 配置
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如移动端、服务端请求）
      if (!origin) {
        callback(null, true);
        return;
      }
      if (CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查路由
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/notice', noticeRoutes);
app.use('/api/admin', adminRoutes);

// 全局错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`API listening on http://localhost:${PORT}`);
  }
});

export default app;