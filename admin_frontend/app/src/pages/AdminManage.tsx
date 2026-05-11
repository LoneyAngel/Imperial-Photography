import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminFunction } from '@/context/function';
import toast from 'react-hot-toast';

interface AdminWithRole {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  roleId: number;
}

const roleNames: Record<number, string> = {
  1: '管理员',
  2: '普通用户',
  3: '超级管理员',
};

export default function AdminManage() {
  const { fetchAdmins, updateUserRole } = useAdminFunction();
  const [admins, setAdmins] = useState<AdminWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const data = await fetchAdmins();
    setAdmins(data);
    setLoading(false);
  };

  const handleRoleChange = async (id: string, newRole: number) => {
    const success = await updateUserRole(id, newRole);
    if (success) {
      toast.success('角色更新成功');
      loadAdmins();
    } else {
      toast.error('更新失败');
    }
  };

  const currentUserId = localStorage.getItem('authToken')
    ? JSON.parse(atob(localStorage.getItem('authToken')!.split('.')[1]))?.userId
    : null;

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>管理员管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">邮箱</th>
                <th className="py-2 px-4 text-left">姓名</th>
                <th className="py-2 px-4 text-left">当前角色</th>
                <th className="py-2 px-4 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm">{admin.id.slice(0, 8)}...</td>
                  <td className="py-2 px-4">{admin.email}</td>
                  <td className="py-2 px-4">{admin.name || '-'}</td>
                  <td className="py-2 px-4">{roleNames[admin.roleId] || '未知'}</td>
                  <td className="py-2 px-4">
                    {admin.id === currentUserId ? (
                      <span className="text-gray-500 text-sm">不能修改自己</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(admin.id, 1)}
                          disabled={admin.roleId === 1}
                        >
                          设为管理员
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(admin.id, 2)}
                          disabled={admin.roleId === 2}
                        >
                          设为普通用户
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(admin.id, 3)}
                          disabled={admin.roleId === 3}
                        >
                          设为超级管理员
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}