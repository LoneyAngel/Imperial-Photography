import { Photo, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { X, Share2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useUser } from '@/context/user';
import { useFunction } from '@/context/function';
import Pagination from '@/components/ui/pagination';
import { useDeferredValue } from 'react';
import '@/styles/PhotoGrid.css';
import { Link } from 'react-router-dom';
import { copyToClipboard, buildUrl } from '@/utils/utils';

export default function MemberProfile() {
  const { updateMemberProfile, updatePhoto, deletePhoto } = useFunction();
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
    mutationFn: ({ name, bio }: { name: string; bio: string }) => updateMemberProfile(name, bio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMe'] });
    },
  });

  // 照片修改
  const updatePhotoMutation = useMutation({
    mutationFn: ({
      id,
      title,
      description,
    }: {
      id: string;
      title?: string;
      description?: string;
    }) => updatePhoto(id, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', 'owner'] });
      setEditingPhoto(null);
    },
  });

  // 照片删除
  const deletePhotoMutation = useMutation({
    mutationFn: (id: string) => deletePhoto(id),
    onSuccess: () => {
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

  const handleShareProfile = () => {
    if (!user) return;
    const url = buildUrl(`/member/${user.id}`, {});
    copyToClipboard(url, '个人主页链接已复制');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                  <img
                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id || user.email.split('@')[0] || 'user'}`}
                    alt=""
                  />
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
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {bio || '—'}
                    </p>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => setEditing(true)}>
                    编辑
                  </Button>
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={handleShareProfile}
                  >
                    <Share2 className="h-4 w-4" />
                    分享主页
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-center w-full mt-3">
                <Link
                  to="/card"
                  className="w-full p-2 rounded-md text-center border hover:bg-gray-200"
                >
                  证书
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">我的作品</h2>
          </div>
          {/* 这部分需要添加照片加载管理 */}
          <Suspense
            fallback={
              <div className="text-center py-16">
                <p className="text-muted-foreground">正在加载作品...</p>
              </div>
            }
          >
            <Photos user={user} setSelectedPhoto={setSelectedPhoto} />
          </Suspense>
        </div>
      </div>

      {/* 查看照片弹窗 - 与 Gallery 风格一致 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-background shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full">
              {/* 左侧图片 */}
              <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                />
              </div>

              {/* 右侧详情 */}
              <div className="w-[350px] md:w-[400px] bg-white flex flex-col border-l border-slate-100">
                <div className="p-6 flex items-center justify-between border-b border-slate-50">
                  <h2 className="text-base font-bold text-slate-800">详细信息</h2>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Title
                    </p>
                    <p className="text-xl font-light text-slate-800 leading-tight">
                      {selectedPhoto.title || 'Untitled Work'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Description
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      {selectedPhoto.description || '这个作者很懒，什么都没有留下...'}
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditPhoto(selectedPhoto)}
                  >
                    编辑
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

function Photos({
  user,
  setSelectedPhoto,
}: {
  user: User | null;
  setSelectedPhoto: (p: Photo | null) => void;
}) {
  const { fetchOwnerPhotos } = useFunction();
  const [page, setPage] = useState(1);

  // 使用 deferredPage，让分页请求在后台静默进行，不阻塞当前 UI
  const deferredPage = useDeferredValue(page);

  const { data: photos } = useSuspenseQuery({
    queryKey: ['photos', 'owner', user?.id, deferredPage], // 使用延迟的页码
    queryFn: () => fetchOwnerPhotos(deferredPage),
    staleTime: 1000 * 60,
  });

  const { list, total, pageSize } = photos;
  const totalPages = Math.ceil(total / (pageSize ?? 30));

  // 判断是否正在加载下一页（用于给 UI 增加淡出效果）
  const isStale = page !== deferredPage;

  if (list.length === 0) {
    return <div className="text-sm text-muted-foreground border rounded-lg p-6">暂无作品</div>;
  }

  return (
    <div
      className={
        isStale ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p: Photo) => (
          <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow photo-item2">
            <CardContent className="pt-4">
              <img
                src={p.url}
                loading="lazy" // 懒加载
                alt={p.title || '未命名作品'}
                className="w-full h-40 object-cover rounded-md"
                onClick={() => setSelectedPhoto(p)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
