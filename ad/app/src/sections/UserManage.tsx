import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/context';
import { useAdminFunction } from '@/context/function';
import { AdminUser } from '@/types';

export default function UserManage() {
  const { showToast } = useToast();
  const { fetchAllUsers, updateUser, deleteUser } = useAdminFunction();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditBio(user.bio || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const success = await updateUser(editingUser.id, {
      name: editName.trim(),
      bio: editBio.trim(),
    });
    if (success) {
      showToast('用户信息更新成功', 'success');
      setEditingUser(null);
      loadUsers();
    } else {
      showToast('更新失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    const success = await deleteUser(id);
    if (success) {
      showToast('用户已删除', 'success');
      loadUsers();
    } else {
      showToast('删除失败', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">ID</th>
                  <th className="py-2 px-4 text-left">邮箱</th>
                  <th className="py-2 px-4 text-left">姓名</th>
                  <th className="py-2 px-4 text-left">简介</th>
                  <th className="py-2 px-4 text-left">创建时间</th>
                  <th className="py-2 px-4 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm">{user.id.slice(0, 8)}...</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">{user.name || '-'}</td>
                    <td className="py-2 px-4 text-sm">{user.bio || '-'}</td>
                    <td className="py-2 px-4 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEdit(user)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 编辑弹窗 */}
      {editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>编辑用户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={editingUser.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>简介</Label>
              <Input
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>保存</Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}