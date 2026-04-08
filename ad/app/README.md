# 管理员前端

照片分享平台的后台管理系统。

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

### 通知管理
- 发布新通知（标题 + 内容）
- 编辑通知
- 删除通知

### 管理员管理（仅超级管理员）
- 查看所有用户及其角色
- 修改用户角色（普通用户/管理员/超级管理员）

## 角色权限

| roleId | 角色 | 权限 |
|--------|------|------|
| 1 | 管理员 | 用户管理、图片管理、通知管理 |
| 2 | 普通用户 | 无管理权限 |
| 3 | 超级管理员 | 全部权限 + 管理员管理 |

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router 7
- **样式**: TailwindCSS
- **UI组件**: Radix UI + Lucide Icons
- **HTTP客户端**: Axios

## 项目结构

```
app/
├── src/
│   ├── components/       # 组件
│   │   ├── ui/           # UI基础组件
│   │   └── AdminNavbar.tsx
│   ├── context/          # React Context
│   │   ├── token.tsx     # Token和角色状态管理
│   │   ├── function.tsx  # API函数
│   │   └── toast.tsx     # Toast提示
│   ├── sections/         # 页面模块
│   │   ├── AdminLogin.tsx
│   │   ├── UserManage.tsx
│   │   ├── PhotoManage.tsx
│   │   ├── NoticeManage.tsx
│   │   └── AdminManage.tsx
│   ├── lib/              # 工具库
│   │   ├── axios.ts      # Axios配置
│   │   └── utils.ts      # 通用工具
│   ├── types/            # 类型定义
│   └── App.tsx           # 主应用
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 配置

### Vite代理
开发环境下，API请求通过Vite代理转发到后端：

```typescript
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

### 环境变量
生产环境需要配置后端API地址。

## 登录

管理员通过邮箱密码登录，登录成功后：
- Token存储在localStorage
- 角色信息存储在localStorage（`userRole`）
- 根据角色显示不同的管理模块

## API接口

所有管理API都需要认证，路径前缀 `/api/admin`：

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/users` | GET | admin/superAdmin | 获取用户列表 |
| `/users/:id` | PUT | admin/superAdmin | 更新用户信息 |
| `/users/:id` | DELETE | admin/superAdmin | 删除用户 |
| `/photos` | GET | admin/superAdmin | 获取图片列表 |
| `/photos/:id/status` | PUT | admin/superAdmin | 更新图片状态 |
| `/photos/:id` | DELETE | admin/superAdmin | 删除图片 |
| `/notices` | GET | admin/superAdmin | 获取通知列表 |
| `/notices` | POST | admin/superAdmin | 创建通知 |
| `/notices/:id` | PUT | admin/superAdmin | 更新通知 |
| `/notices/:id` | DELETE | admin/superAdmin | 删除通知 |
| `/admins` | GET | superAdmin | 获取所有用户角色 |
| `/admins/:id/role` | PUT | superAdmin | 更新用户角色 |

## 相关项目

- **后端API**: `../ab/` - Express + Prisma + PostgreSQL
- **用户前端**: `../ac/app/` - 用户照片分享平台