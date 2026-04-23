# Imperial Photography - 用户前端

摄影师社区平台的用户端应用，支持作品浏览、照片上传、个人资料管理等功能。

## 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **TanStack Query** - 服务器状态管理
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Axios** - HTTP 客户端

## 项目结构

```
src/
├── assets/             # 静态资源
│   ├── home-bg.jpg     # 首页背景
│   └── picture/        # 示例图片
├── components/         # 公共组件
│   ├── ui/            # shadcn/ui 基础组件
│   ├── Navbar.tsx     # 导航栏
│   ├── Photocard.tsx  # 照片卡片
│   └── ErrorBoundary.tsx
├── config/            # 配置文件
├── context/           # React Context
│   ├── token.tsx     # Token 管理（认证状态）
│   ├── user.tsx      # 用户信息
│   └── function.tsx  # API 函数封装
├── hooks/             # 自定义 Hooks
├── sections/          # 页面组件
│   ├── Home.tsx             # 首页
│   ├── Gallery.tsx          # 作品展示
│   ├── Upload.tsx           # 上传作品
│   ├── MemberAuth.tsx       # 登录页
│   ├── MemberRegister.tsx   # 注册页
│   ├── MemberProfile.tsx    # 个人中心
│   ├── MemberPublicProfile.tsx # 公开用户主页
│   ├── Notice.tsx           # 公告列表
│   ├── ForgotPassword.tsx   # 忘记密码
│   ├── ResetPassword.tsx    # 重置密码
│   └── SetPassword.tsx      # 设置密码
├── styles/            # 样式文件
├── types/             # TypeScript 类型定义
├── utils/             # 工具函数
│   ├── axios.ts       # Axios 配置
│   ├── imageCompress.ts # 图片压缩
│   ├── validation.ts  # 表单验证
│   └── utils.ts       # 通用工具
├── App.tsx            # 应用根组件
└── main.tsx           # 应用入口
```

## 功能特性

### 用户认证
- 邮箱验证码登录/注册
- 密码登录
- 密码找回/重置
- Token 自动刷新（使用 HttpOnly Cookie）
- 登录后状态自动同步

### 作品展示
- 照片瀑布流展示
- 作品搜索（按作品名、作者名）
- 作品详情弹窗
- 作者信息展示
- 公开用户主页

### 作品上传
- 图片上传
- 图片压缩（大于 3MB 自动压缩）
- 作品信息填写
- 审核状态显示

### 个人中心
- 个人资料修改
- 我的作品管理
- 作品修改/删除

### 公告系统
- 公告列表
- 公告详情查看

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 环境配置

项目需要后端 API 支持，API 请求通过 Vite 代理转发：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
});
```

## 认证机制

### Token 存储
- **authToken**: 存储在内存中，防止 XSS 攻击
- **refreshToken**: 存储在 HttpOnly Cookie 中，由浏览器自动管理

### 自动刷新流程
1. 页面刷新时，用 Cookie 中的 refreshToken 获取新 authToken
2. 请求返回 401 时，axios 拦截器自动刷新 authToken
3. 刷新成功后重试原请求

## API 函数

所有 API 函数封装在 `context/function.tsx` 中：

| 函数 | 说明 |
|-----|------|
| `requestCode` | 请求验证码（注册/登录/重置密码） |
| `verifyCodeAndLogin` | 验证码登录 |
| `loginWithPassword` | 密码登录 |
| `registerMember` | 注册用户 |
| `setPassword` | 设置密码 |
| `resetPassword` | 重置密码 |
| `logout` | 登出 |
| `fetchPhotos` | 获取已审核照片列表 |
| `searchPhotos` | 搜索照片 |
| `uploadPhoto` | 上传照片 |
| `updatePhoto` | 修改照片信息 |
| `deletePhoto` | 删除照片 |
| `fetchMyPhotos` | 获取我的照片 |
| `fetchMemberProfile` | 获取用户信息 |
| `updateMemberProfile` | 更新用户信息 |
| `fetchPublicProfile` | 获取公开用户信息 |
| `fetchNotices` | 获取公告列表 |
| `fetchNoticeDetail` | 获取公告详情 |

## 照片审核流程

```
用户上传 → status: pending
    ↓
管理员审核 → approved / rejected
    ↓
Gallery 展示 → 只显示 approved
```

## 相关项目

- **后端 API**: [../../backend/](../../backend/) - Express + Prisma + PostgreSQL
- **管理后台**: [../../admin_frontend/app/](../../admin_frontend/app/) - 管理员前端

## License

MIT
