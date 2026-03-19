import './env.js';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './utils/errors.js';

// 导入路由
import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import memberRoutes from './routes/members.js';

const PORT = Number(process.env.PORT ?? '4001');
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// CORS 配置
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 全局错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`API listening on http://localhost:${PORT}`);
  }
});

export default app;