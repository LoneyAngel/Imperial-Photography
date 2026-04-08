# Imperial Use - 摄影师社区平台

一个面向摄影创作者的国际摄影组织网站，用户可以浏览作品、上传照片、管理个人资料。

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **TanStack Query** - 服务器状态管理
- **Tailwind CSS** - 样式框架
- **Radix UI** - 无障碍 UI 组件
- **Axios** - HTTP 客户端

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── ui/             # 基础 UI 组件
│   └── Navbar.tsx      # 导航栏
├── context/            # React Context
│   ├── token.tsx       # Token 管理（认证状态）
│   ├── user.tsx        # 用户信息
│   ├── function.tsx    # API 函数封装
│   └── toast.tsx       # 全局通知
├── sections/           # 页面组件
│   ├── Home.tsx        # 首页
│   ├── Gallery.tsx     # 作品展示（支持搜索）
│   ├── Upload.tsx      # 上传作品
│   ├── MemberAuth.tsx  # 登录页
│   ├── MemberRegister.tsx # 注册页
│   ├── MemberProfile.tsx  # 个人中心
│   ├── Notice.tsx      # 通知列表
│   ├── ForgotPassword.tsx # 忘记密码
│   ├── ResetPassword.tsx  # 重置密码
│   └── SetPassword.tsx    # 设置密码
├── lib/                # 工具库
│   ├── axios.ts        # Axios 配置（拦截器、Token 刷新）
│   └── utils.ts        # 通用工具函数
├── types/              # TypeScript 类型定义
└── App.tsx             # 应用入口
```

## 功能特性

### 用户认证
- 邮箱验证码登录
- 密码登录
- 用户注册
- 密码找回/重置
- Token 自动刷新

### 作品展示
- 照片瀑布流展示
- 作品搜索（按作品名、作者名）
- 作品详情弹窗
- 作者信息展示

### 作品上传
- 图片上传
- 图片压缩（大于 3MB 自动压缩）
- 作品信息填写
- 审核状态显示

### 个人中心
- 个人资料修改
- 我的作品管理
- 作品修改/删除

### 通知系统
- 通知列表
- 通知详情查看

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 环境配置

项目需要后端 API 支持，默认请求地址为 `/api/*`。

如需配置代理，在 `vite.config.ts` 中设置：

```typescript
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
- **authToken**: 存储在内存中（模块级变量），防止 XSS 攻击
- **refreshToken**: 存储在 HttpOnly Cookie 中，由浏览器自动管理

### 自动刷新流程
1. 页面刷新时，用 Cookie 中的 refreshToken 获取新 authToken
2. 请求返回 401 时，axios 拦截器自动刷新 authToken
3. 刷新成功后重试原请求

## API 函数

所有 API 函数封装在 `context/function.tsx` 中：

| 函数 | 说明 |
|-----|------|
| `loginMemberWithEmail` | 邮箱验证码登录 |
| `loginMemberWithPassword` | 密码登录 |
| `fetchPhotos` | 获取已审核照片列表 |
| `uploadPhoto` | 上传照片 |
| `updatePhoto` | 修改照片信息 |
| `deletePhoto` | 删除照片 |
| `fetchMemberProfile` | 获取用户信息 |
| `updateMemberProfile` | 更新用户信息 |
| `fetchNotices` | 获取通知列表 |

## 照片审核流程

```
用户上传 → status: pending
    ↓
管理员审核 → approved / rejected
    ↓
Gallery 展示 → 只显示 approved
```

## 组件设计原则

- 使用 `useCallback` 缓存作为 props 或依赖项的函数
- 使用 `useMemo` 缓存复杂计算结果和对象
- Context value 使用 `useMemo` 包装，避免不必要重渲染

## License

MIT