import { Photo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useUser } from '@/context/user';
import { useFunction } from '@/context/function';
import { queryClient } from '@/App';
export default function MemberProfile() {
  const { fetchOwnerPhotos,updateMemberProfile } = useFunction();
  const { user } = useUser();
  

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);

  // 当user数据更新时，同步更新本地状态
  
  useEffect(() => {
    if(user){
      setName(user.name ?? '');
      setBio(user.bio ?? '');
    }
  }, [user]);
  
  const mutation = useMutation({
    mutationFn: ({ name, bio }: { name: string; bio: string }) => 
      updateMemberProfile(name, bio), // 你的修改接口
    onSuccess: () => {
      // 关键：让 queryKey 为 ['userMe'] 的缓存失效
      // 这会触发 UserProvider 里的 refetch，从而更新全局 user
      queryClient.invalidateQueries({ queryKey: ['userMe'] });
    },
  });
  const { data } = useQuery({
    // 1. 设置唯一的 Key
    queryKey: ['photos', 'owner', user?.id],
    
    // 2. 如果缓存没有，去执行这个函数
    queryFn: () => fetchOwnerPhotos(user?.id ?? ''),

    // 3. 【核心逻辑】尝试从“列表页”的缓存里直接拿数据
    initialData: () => {
      if (!user) return undefined;
      // 去缓存池里找 ['photos'] 那个大文件夹
      const listCache = queryClient.getQueryData(['photos']) as Photo[] | undefined;
      console.log(listCache);
      if (!listCache) return;
      // 在文件夹里翻找 ID 匹配的那一张照片
      return listCache?.filter((p: Photo) => p.ownerMemberId === user?.id);
    },

    // 4. 告诉 React Query 列表数据是什么时候存的，防止详情页拿到太旧的数据
    initialDataUpdatedAt: () => 
      queryClient.getQueryState(['photos'])?.dataUpdatedAt,
      
    staleTime: 1000 * 60, // 详情数据 1 分钟内不重复请求
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutate({ name: name.trim(), bio: bio.trim() });
      setEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
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
                    <p className="text-sm text-muted-foreground">个人名称</p>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">个人简介</p>
                    <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={mutation.isPending} className="flex-1">
                      {mutation.isPending ? '保存中...' : '保存'}
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
                <Card key={p.id}>
                  <CardContent className="pt-4">
                    <img src={p.url} alt={p.title || '未命名作品'} className="w-full h-40 object-cover rounded-md mb-3" />
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
    </div>
  );
}
