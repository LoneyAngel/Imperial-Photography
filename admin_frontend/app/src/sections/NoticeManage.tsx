import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/context';
import { useAdminFunction } from '@/context/function';

interface Notice {
  id: string;
  title: string;
  contentUrl: string;
  createdAt: string;
  createdMemberId: string;
}

export default function NoticeManage() {
  const { showToast } = useToast();
  const { fetchNotices, createNotice, updateNotice, deleteNotice } = useAdminFunction();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editContentLoading, setEditContentLoading] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    const data = await fetchNotices();
    setNotices(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      showToast('请输入通知标题', 'error');
      return;
    }
    if (!newContent.trim()) {
      showToast('请输入通知内容', 'error');
      return;
    }
    const notice = await createNotice(newTitle.trim(), newContent.trim());
    if (notice) {
      showToast('通知发布成功', 'success');
      setNewTitle('');
      setNewContent('');
      loadNotices();
    } else {
      showToast('发布失败', 'error');
    }
  };

  const handleEdit = async (notice: Notice) => {
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContentLoading(true);
    try {
      const res = await fetch(notice.contentUrl);
      const content = await res.text();
      setEditContent(content);
    } catch {
      setEditContent('');
    }
    setEditContentLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editingNotice) return;
    if (!editTitle.trim()) {
      showToast('请输入通知标题', 'error');
      return;
    }
    const success = await updateNotice(editingNotice.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    if (success) {
      showToast('通知更新成功', 'success');
      setEditingNotice(null);
      loadNotices();
    } else {
      showToast('更新失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该通知吗？')) return;
    const success = await deleteNotice(id);
    if (success) {
      showToast('通知已删除', 'success');
      loadNotices();
    } else {
      showToast('删除失败', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 发布新通知 */}
      <Card>
        <CardHeader>
          <CardTitle>发布新通知</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newTitle">通知标题</Label>
            <Input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="请输入通知标题"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newContent">通知内容</Label>
            <textarea
              id="newContent"
              className="w-full min-h-[150px] px-3 py-2 border rounded-md resize-y"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="请输入通知内容"
            />
          </div>
          <Button onClick={handleCreate}>发布通知</Button>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center text-gray-500 py-4">暂无通知</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">ID</th>
                    <th className="py-2 px-4 text-left">标题</th>
                    <th className="py-2 px-4 text-left">发布时间</th>
                    <th className="py-2 px-4 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr key={notice.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm">{notice.id.slice(0, 8)}...</td>
                      <td className="py-2 px-4">{notice.title}</td>
                      <td className="py-2 px-4 text-sm">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEdit(notice)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(notice.id)}
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑弹窗 */}
      {editingNotice && (
        <Card>
          <CardHeader>
            <CardTitle>编辑通知</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>通知标题</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>通知内容</Label>
              {editContentLoading ? (
                <div className="text-gray-500 py-4">加载内容中...</div>
              ) : (
                <textarea
                  className="w-full min-h-[150px] px-3 py-2 border rounded-md resize-y"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>保存</Button>
              <Button variant="outline" onClick={() => setEditingNotice(null)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}