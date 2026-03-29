import { User, Photo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/useData';

interface MemberProfileProps {
  user: User;
  onSave: (name: string, bio: string) => void;
}

export default function MemberProfile({ user, onSave }: MemberProfileProps) {
  const [name, setname] = useState(user.name ?? '');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const { fetchOwnerPhotos } = useData();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    // 1. 设置唯一的 Key
    queryKey: ['photos', 'owner', user.id],
    
    // 2. 如果缓存没有，去执行这个函数
    queryFn: () => fetchOwnerPhotos(user.id),

    // 3. 【核心逻辑】尝试从“列表页”的缓存里直接拿数据
    initialData: () => {
      // 去缓存池里找 ['photos'] 那个大文件夹
      const listCache = queryClient.getQueryData(['photos']);
      console.log(listCache);
      if (!listCache) return;
      // 在文件夹里翻找 ID 匹配的那一张照片
      return listCache?.filter((p: Photo) => p.ownerMemberId === user.id);
    },

    // 4. 告诉 React Query 列表数据是什么时候存的，防止详情页拿到太旧的数据
    initialDataUpdatedAt: () => 
      queryClient.getQueryState(['photos'])?.dataUpdatedAt,
      
    staleTime: 1000 * 60, // 详情数据 1 分钟内不重复请求
  });

  // 独立获取bio数据
  useEffect(() => {
    const fetchBio = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/members/${user.id}/bio`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setBio(data.bio ?? '');
        }
      } catch (error) {
        console.error('获取bio失败:', error);
      }
    };

    fetchBio();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/members/${user.id}/bio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio: bio.trim() })
      });

      if (res.ok) {
        onSave(name, bio); // 同时更新name
        setEditing(false);
      } else {
        console.error('保存bio失败');
      }
    } catch (error) {
      console.error('保存bio失败:', error);
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
                    <Input value={name} onChange={(e) => setname(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">个人简介</p>
                    <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">保存</Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setname(user.name ?? '');
                        // 取消时重新获取bio
                        const fetchBio = async () => {
                          try {
                            const token = localStorage.getItem('authToken');
                            const res = await fetch(`/api/members/${user.id}/bio`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setBio(data.bio ?? '');
                            }
                          } catch (error) {
                            console.error('获取bio失败:', error);
                          }
                        };
                        fetchBio();
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
                    <p className="text-sm font-medium break-words">{user.name || '—'}</p>
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
              {data.map((p: Photo) => (
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
