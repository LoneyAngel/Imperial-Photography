# Imperial Photography

知名摄影师作品展示与管理平台，支持用户注册、照片上传、管理员审核等功能。

## 项目结构

```
├── backend/           # 后端服务 (Express + Prisma)
├── frontend/          # 用户前端 (React + Vite)
├── admin_frontend/    # 管理员前端 (React + Vite)
└── LICENSE            # MIT 许可证
```

## 技术栈

### 后端
- **框架**: Express.js
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + HTTP-only Cookie
- **存储**: 阿里云 OSS / 本地存储
- **邮件**: Nodemailer (验证码发送)

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: React Query + Context API
- **路由**: React Router DOM
- **UI组件**: Radix UI

## 功能特性

### 用户端
- 用户注册/登录 (邮箱验证码 + 密码)
- 个人资料管理 (头像、简介)
- 照片上传与管理
- 作品画廊浏览与搜索
- 公告查看

### 管理端
- 管理员登录认证
- 用户管理 (查看、删除)
- 照片审核 (待审核/已通过/已拒绝)
- 公告发布与管理
- 超级管理员: 管理员权限分发

## 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- npm 或 pnpm

### 后端配置

1. 进入后端目录
```bash
cd backend
npm install
```

2. 配置环境变量 (创建 `.env` 文件)
```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名"
PORT=4001
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
JWT_SECRET="your-jwt-secret"
OSS_REGION="your-oss-region"
OSS_BUCKET="your-oss-bucket"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
```

3. 初始化数据库
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. 启动开发服务器
```bash
npm run dev
```

### 前端配置

1. 进入前端目录
```bash
cd frontend/app
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

### 管理前端配置

1. 进入管理前端目录
```bash
cd admin_frontend/app
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

## API 路由

| 路径 | 说明 |
|------|------|
| `/api/auth` | 认证相关 (注册、登录、验证码) |
| `/api/photos` | 照片管理 |
| `/api/members` | 用户信息 |
| `/api/notice` | 公告系统 |
| `/api/admin/*` | 管理员专用接口 |

## 数据库模型

- **Member**: 用户信息
- **Photo**: 照片 (状态: pending/approved/rejected)
- **Notice**: 公告
- **Role**: 角色 (普通用户/管理员/超级管理员)
- **UserRole**: 用户角色关联

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。