# 正在做的

修改toast形式

## 通知系统

- 连接前后端
- 补充数据缓存


# 等待做的

- 使用Refine整个后台

- 分割普通用户和admin用户 
    方案：RBAC (基于角色的访问控制)
    这是工业界的标准做法。它通过增加一张“角色表”来解耦用户和权限。

    表结构设计：

    users 表：存储基本信息（不存 role）。

    roles 表：存储角色定义（id, name, description）。

    例如：1: super_admin, 2: editor, 3: common_user。

    user_roles 关联表：连接用户和角色（user_id, role_id）。

    优点：支持“一个用户拥有多个角色”；增加新角色不需要修改 users 表结构。

- 将本地存储修改成对象存储

- 进行名利的渲染



# 启迪

必须有架构