# Imperial Photography - 管理后台

摄影师社区平台的管理后台系统，提供用户管理、照片审核、公告发布等功能。

## 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Axios** - HTTP 客户端

## 功能模块

### 用户管理
- 查看所有用户列表
- 编辑用户信息（姓名、简介）
- 删除用户

### 图片管理
- 查看所有上传图片
- 按状态筛选（待审核、已批准、已拒绝）
- 审核图片（批准/拒绝）
- 删除图片

### 公告管理
- 发布新公告（标题 + 内容）
- 编辑公告
- 删除公告

### 管理员管理（仅超级管理员）
- 查看所有用户及其角色
- 修改用户角色（普通用户/管理员/超级管理员）

## 角色权限

| roleId | 角色 | 权限 |
|--------|------|------|
| 1 | 管理员 | 用户管理、图片管理、公告管理 |
| 2 | 普通用户 | 无管理权限 |
| 3 | 超级管理员 | 全部权限 + 管理员管理 |

## 项目结构

```
src/
├── components/        # 组件
│   ├── ui/           # shadcn/ui 基础组件
│   └── AdminNavbar.tsx
├── context/          # React Context
│   ├── token.tsx    # Token 和角色状态管理
│   └── function.tsx # API 函数
├── sections/         # 页面模块
│   ├── AdminLogin.tsx
│   ├── UserManage.tsx
│   ├── PhotoManage.tsx
│   ├── NoticeManage.tsx
│   └── AdminManage.tsx
├── lib/              # 工具库
│   ├── axios.ts     # Axios 配置
│   └── utils.ts     # 通用工具
├── types/            # 类型定义
├── App.tsx           # 主应用
└── main.tsx          # 应用入口
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5174`

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

### Vite 代理

开发环境下，API 请求通过 Vite 代理转发到后端：

```typescript
// vite.config.ts
server: {
  port: 5174,
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
    },
  },
}
```

## 登录流程

管理员通过邮箱密码登录，登录成功后：
- Token 存储在内存中
- Refresh Token 存储在 HttpOnly Cookie 中
- 角色信息从用户信息中获取
- 根据角色显示不同的管理模块

## API 接口

所有管理 API 都需要认证，路径前缀 `/api/admin`：

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/users` | GET | admin/superAdmin | 获取用户列表 |
| `/users/:id` | PUT | admin/superAdmin | 更新用户信息 |
| `/users/:id` | DELETE | admin/superAdmin | 删除用户 |
| `/photos` | GET | admin/superAdmin | 获取图片列表 |
| `/photos/:id/status` | PUT | admin/superAdmin | 更新图片状态 |
| `/photos/:id` | DELETE | admin/superAdmin | 删除图片 |
| `/notices` | GET | admin/superAdmin | 获取公告列表 |
| `/notices` | POST | admin/superAdmin | 创建公告 |
| `/notices/:id` | PUT | admin/superAdmin | 更新公告 |
| `/notices/:id` | DELETE | admin/superAdmin | 删除公告 |
| `/admins` | GET | superAdmin | 获取所有用户角色 |
| `/admins/:id/role` | PUT | superAdmin | 更新用户角色 |

## 相关项目

- **后端 API**: [../../backend/](../../backend/) - Express + Prisma + PostgreSQL
- **用户前端**: [../../frontend/app/](../../frontend/app/) - 用户端应用

## License

MIT
