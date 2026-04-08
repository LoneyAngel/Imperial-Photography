import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';

// 导入子路由
import usersRoutes from './users.js';
import photosRoutes from './photos.js';
import adminsRoutes from './admins.js';
import noticesRoutes from './notices.js';

const router = Router();

// 所有管理员路由都需要认证
router.use(authMiddleware);

// 注册子路由
router.use('/users', usersRoutes);
router.use('/photos', photosRoutes);
router.use('/admins', adminsRoutes);
router.use('/notices', noticesRoutes);

export default router;
