import { Photo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/user';
import { useFunction } from '@/context/function';

export default function MemberProfile() {
  const { fetchOwnerPhotos, updateMemberProfile, updatePhoto, deletePhoto } = useFunction();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);

  // 照片查看/编辑状态
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');

  // 当user数据更新时，同步更新本地状态
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setBio(user.bio ?? '');
    }
  }, [user]);

  // ESC 关闭弹窗
  useEffect(() => {
    if (!selectedPhoto && !editingPhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setEditingPhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhoto, editingPhoto]);

  // 用户信息修改
  const profileMutation = useMutation({
    mutationFn: ({ name, bio }: { name: string; bio: string }) =>
      updateMemberProfile(name, bio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMe'] });
    },
  });

  // 获取用户照片
  const { data } = useQuery({
    queryKey: ['photos', 'owner', user?.id],
    queryFn: () => fetchOwnerPhotos(user?.id ?? ''),
    initialData: () => {
      if (!user) return undefined;
      const listCache = queryClient.getQueryData(['photos']) as Photo[] | undefined;
      if (!listCache) return;
      return listCache?.filter((p: Photo) => p.ownerMemberId === user?.id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['photos'])?.dataUpdatedAt,
    staleTime: 1000 * 60,
  });

  // 照片修改
  const updatePhotoMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title?: string; description?: string }) =>
      updatePhoto(id, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photos', 'owner'] });
      setEditingPhoto(null);
    },
  });

  // 照片删除
  const deletePhotoMutation = useMutation({
    mutationFn: (id: string) => deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photos', 'owner'] });
      setSelectedPhoto(null);
      setEditingPhoto(null);
    },
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileMutation.mutate({ name: name.trim(), bio: bio.trim() });
      setEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setPhotoTitle(photo.title || '');
    setPhotoDescription(photo.description || '');
    setSelectedPhoto(null);
  };

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    await updatePhotoMutation.mutate({
      id: editingPhoto.id,
      title: photoTitle.trim(),
      description: photoDescription.trim(),
    });
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (confirm('确定要删除这张照片吗？')) {
      await deletePhotoMutation.mutate(photo.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                  {(name || user.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">名称</p>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">简介</p>
                    <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={profileMutation.isPending} className="flex-1">
                      {profileMutation.isPending ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setName(user.name ?? '');
                        setBio(user.bio ?? '');
                        setEditing(false);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">个人名称</p>
                    <p className="text-sm font-medium break-words">{name || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">个人简介</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{bio || '—'}</p>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => setEditing(true)}>
                    修改
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">我的作品</h2>
          </div>
          {data?.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-lg p-6">
              暂无作品
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.map((p: Photo) => (
                <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-4">
                    <img
                      src={p.url}
                      alt={p.title || '未命名作品'}
                      className="w-full h-40 object-cover rounded-md mb-3"
                      onClick={() => setSelectedPhoto(p)}
                    />
                    <p className="text-sm font-medium">{p.title || '未命名作品'}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 查看照片弹窗 - 与 Gallery 风格一致 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-background shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-200">
            <div className="flex h-full">
              {/* 左侧：图片展示区 */}
              <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                />
              </div>

              {/* 右侧：信息详情区 */}
              <div className="w-[350px] md:w-[400px] bg-white flex flex-col border-l border-slate-100">
                {/* 头部：关闭按钮和标题 */}
                <div className="p-6 flex items-center justify-between border-b border-slate-50">
                  <h2 className="text-base font-bold text-slate-800">详细信息</h2>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 中间：滚动内容区 */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* 标题板块 */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Title</p>
                    <p className="text-xl font-light text-slate-800 leading-tight">
                      {selectedPhoto.title || 'Untitled Work'}
                    </p>
                  </div>

                  {/* 介绍板块 */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      {selectedPhoto.description || '这个作者很懒，什么都没有留下...'}
                    </p>
                  </div>
                </div>

                {/* 底部：操作按钮 */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditPhoto(selectedPhoto)}
                  >
                    修改
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleDeletePhoto(selectedPhoto)}
                    disabled={deletePhotoMutation.isPending}
                  >
                    {deletePhotoMutation.isPending ? '删除中...' : '删除'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑照片弹窗 */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingPhoto(null)}
        >
          <div
            className="bg-background rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">修改作品信息</h2>
            <div className="mb-4">
              <img
                src={editingPhoto.url}
                alt={editingPhoto.title || '未命名作品'}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
            <form onSubmit={handleUpdatePhoto} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">作品名称</p>
                <Input
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="输入作品名称"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">作品介绍</p>
                <Textarea
                  rows={4}
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="输入作品介绍"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updatePhotoMutation.isPending} className="flex-1">
                  {updatePhotoMutation.isPending ? '保存中...' : '保存'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingPhoto(null)}
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}