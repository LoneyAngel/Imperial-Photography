# Imperial 摄影师网站

## 1. 项目介绍

Imperial 摄影师网站后端是一个为摄影师社区平台提供 API 服务的 Node.js 应用。支持用户注册登录、照片上传管理、公告发布等核心功能，并提供完整的权限管理系统。

### 核心特性

- 🔐 **安全认证**：JWT 双 Token 认证机制，Refresh Token 存储 HttpOnly Cookie
- 📷 **照片管理**：支持照片上传、审核、展示
- 👥 **权限系统**：三级角色权限（超级管理员、管理员、普通用户）
- 📧 **邮箱验证**：验证码注册登录，支持密码登录
- 📢 **公告系统**：管理员发布公告通知

---

## 2. 技术架构

### 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | - |
| 框架 | Express | 4.19 |
| 语言 | TypeScript | 5.6 |
| ORM | Prisma | 5.22 |
| 数据库 | PostgreSQL | - |
| 参数验证 | Zod | 3.23 |
| 认证 | JWT (jsonwebtoken) | 9.0 |
| 密码加密 | bcryptjs | 3.0 |
| 邮件服务 | Nodemailer | 6.9 |
| 文件存储 | 阿里云 OSS / 本地存储 | - |

### 项目结构

```
src/
├── index.ts              # 应用入口
├── env.ts                # 环境变量加载
├── storage.ts            # 文件存储服务（OSS/本地）
├── types/                # TypeScript 类型定义
├── middleware/           # Express 中间件
│   ├── auth.ts           # JWT 认证中间件
│   ├── admin.ts          # 管理员权限中间件
│   └── errors.ts         # 全局错误处理
├── router/               # API 路由
│   ├── auth.ts           # 认证相关
│   ├── photos.ts         # 照片管理
│   ├── members.ts        # 用户信息
│   ├── notice.ts         # 公告（公开）
│   └── admin/            # 管理后台
│       ├── index.ts      # 路由汇总
│       ├── users.ts      # 用户管理
│       ├── photos.ts     # 照片管理
│       ├── admins.ts     # 管理员管理
│       └── notices.ts    # 公告管理
└── utils/                # 工具函数
    ├── prisma.ts         # Prisma 客户端
    ├── api.ts            # API 响应工具
    ├── jwt.ts            # JWT 工具
    ├── email.ts          # 邮件服务
    └── cache.ts          # 内存缓存
```

### 数据库模型

```
┌─────────────┐     ┌─────────────────┐     ┌───────────┐
│   Member    │────<│     Photo       │     │   Notice  │
├─────────────┤     ├─────────────────┤     ├───────────┤
│ id          │     │ id              │     │ id        │
│ email       │     │ title           │     │ title     │
│ password    │     │ description     │     │ contentUrl│
│ name        │     │ url             │     │ createdAt │
│ bio         │     │ status          │     │ createdMem│
│ createdAt   │     │ createdAt       │     └───────────┘
│ verifiedAt  │     │ ownerMemberId   │
└─────────────┘     └─────────────────┘
       │
       │            ┌─────────────────┐     ┌───────────┐
       └───────────>│    UserRole     │────>│   Role    │
                    ├─────────────────┤     ├───────────┤
                    │ userId          │     │ id        │
                    │ roleId          │     │ name      │
                    └─────────────────┘     └───────────┘
```

### 认证流程

```
┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───>│  Auth API    │───>│  Cookie  │
└──────────┘    └──────────────┘    └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │ AuthToken    │ ──> 内存/State (30分钟)
              │ RefreshToken │ ──> HttpOnly Cookie (15天)
              └──────────────┘
                      │
                      ▼ 401 时自动刷新
              ┌──────────────┐
              │ /auth/refresh│
              └──────────────┘
```

---

## 3. 实现功能

### 3.1 用户认证

| API | 方法 | 说明 |
|-----|------|------|
| `/api/auth/request-register-code` | POST | 请求注册验证码 |
| `/api/auth/request-login-code` | POST | 请求登录验证码 |
| `/api/auth/verify-code` | POST | 验证验证码（注册/登录） |
| `/api/auth/login` | POST | 密码登录 |
| `/api/auth/set-password` | POST | 设置密码 |
| `/api/auth/reset-password` | POST | 重置密码 |
| `/api/auth/refresh` | POST | 刷新 Token |
| `/api/auth/logout` | POST | 登出 |

### 3.2 照片管理

| API | 方法 | 权限 | 说明 |
|-----|------|------|------|
| `/api/photos` | GET | 公开 | 获取照片列表（普通用户仅已审核） |
| `/api/photos/user-photos` | GET | 登录 | 获取自己的照片 |
| `/api/photos` | POST | 登录 | 上传照片 |
| `/api/photos/:id` | PUT | 登录 | 修改照片信息 |
| `/api/photos/:id` | DELETE | 登录 | 删除照片 |

### 3.3 用户信息

| API | 方法 | 权限 | 说明 |
|-----|------|------|------|
| `/api/members/detail` | GET | 登录 | 获取个人信息 |
| `/api/members/update` | PUT | 登录 | 更新个人信息 |

### 3.4 公告系统

| API | 方法 | 权限 | 说明 |
|-----|------|------|------|
| `/api/notice` | GET | 公开 | 获取公告列表 |
| `/api/notice/:id` | GET | 公开 | 获取公告详情 |

### 3.5 管理后台

#### 用户管理（管理员）

| API | 方法 | 说明 |
|-----|------|------|
| `/api/admin/users` | GET | 获取用户列表 |
| `/api/admin/users/:id` | PUT | 更新用户信息 |
| `/api/admin/users/:id` | DELETE | 删除用户 |

#### 照片管理（管理员）

| API | 方法 | 说明 |
|-----|------|------|
| `/api/admin/photos` | GET | 获取所有照片 |
| `/api/admin/photos/:id/status` | PUT | 更新照片状态 |
| `/api/admin/photos/:id` | DELETE | 删除照片 |

#### 管理员管理（超级管理员）

| API | 方法 | 说明 |
|-----|------|------|
| `/api/admin/admins` | GET | 获取用户及角色列表 |
| `/api/admin/admins/:id/role` | PUT | 更新用户角色 |

#### 公告管理（管理员）

| API | 方法 | 说明 |
|-----|------|------|
| `/api/admin/notices` | GET | 获取公告列表 |
| `/api/admin/notices` | POST | 创建公告 |
| `/api/admin/notices/:id` | PUT | 更新公告 |
| `/api/admin/notices/:id` | DELETE | 删除公告 |

### 3.6 权限体系

| 角色ID | 角色名 | 权限范围 |
|--------|--------|----------|
| 1 | admin | 用户管理、照片管理、公告管理 |
| 2 | user | 个人信息管理、照片上传 |
| 3 | superAdmin | 所有权限 + 管理员角色分配 |

---

## 4. 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# 服务配置
PORT=4000
NODE_ENV=development

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public

# JWT
JWT_SECRET=your-jwt-secret
JWT_AUTH_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=15d

# 验证码
VERIFICATION_CODE_SECRET=your-verification-secret

# SMTP 邮件
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=Your Name

# OSS 存储（可选）
OSS_REGION=
OSS_ENDPOINT=
OSS_BUCKET=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_PUBLIC_BASE_URL=

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 数据库初始化

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 初始化角色数据
npx tsx prisma/seed.ts
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

---

## 5. API 响应格式

### 成功响应

```json
{
  "id": "cmn1pqmde000110qwevhc3nhp",
  "email": "user@example.com",
  "name": "张三"
}
```

### 错误响应

```json
{
  "error": "invalid_credentials"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `invalid_credentials` | 401 | 账号或密码错误 |
| `invalid_code` | 400 | 验证码错误 |
| `code_expired` | 400 | 验证码已过期 |
| `missing_token` | 401 | 缺少认证 Token |
| `invalid_token` | 401 | Token 无效或过期 |
| `forbidden` | 403 | 无权限访问 |
| `not_found` | 404 | 资源不存在 |

---

## 6. 安全特性

- ✅ JWT Auth Token 存储在内存中，不暴露给 localStorage
- ✅ Refresh Token 存储 HttpOnly Cookie，防止 XSS
- ✅ Cookie 设置 `sameSite: lax`，防止 CSRF
- ✅ 密码使用 bcrypt 加密存储
- ✅ 验证码 5 分钟过期，最多尝试 3 次
- ✅ 后端权限校验，防止越权访问