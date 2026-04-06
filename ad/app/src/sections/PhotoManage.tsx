import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context';
import { useAdminFunction } from '@/context/function';
import { Photo } from '@/types';

export default function PhotoManage() {
  const { showToast } = useToast();
  const { fetchAllPhotos, updatePhotoStatus, deletePhoto } = useAdminFunction();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const status = statusFilter === 'all' ? undefined : statusFilter;
    const data = await fetchAllPhotos(status);
    setPhotos(data);
    setLoading(false);
  };

  const handleStatusChange = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setStatusFilter(status);
    setTimeout(() => loadPhotos(), 100);
  };

  const handleApprove = async (id: string) => {
    const success = await updatePhotoStatus(id, 'approved');
    if (success) {
      showToast('图片已批准', 'success');
      loadPhotos();
    } else {
      showToast('操作失败', 'error');
    }
  };

  const handleReject = async (id: string) => {
    const success = await updatePhotoStatus(id, 'rejected');
    if (success) {
      showToast('图片已拒绝', 'success');
      loadPhotos();
    } else {
      showToast('操作失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该图片吗？')) return;
    const success = await deletePhoto(id);
    if (success) {
      showToast('图片已删除', 'success');
      loadPhotos();
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
          <CardTitle>图片管理</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 状态筛选 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('all')}
            >
              全部
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('pending')}
            >
              待审核
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('approved')}
            >
              已批准
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('rejected')}
            >
              已拒绝
            </Button>
          </div>

          {/* 图片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{photo.title || '无标题'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    状态: {photo.status === 'pending' ? '待审核' : photo.status === 'approved' ? '已批准' : '已拒绝'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    上传者: {photo.ownerMemberId.slice(0, 8)}...
                  </p>
                  <div className="flex gap-2 mt-3">
                    {photo.status !== 'approved' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(photo.id)}
                      >
                        批准
                      </Button>
                    )}
                    {photo.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(photo.id)}
                      >
                        拒绝
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(photo.id)}
                    >
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {photos.length === 0 && (
            <p className="text-center text-muted-foreground py-10">暂无图片数据</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}