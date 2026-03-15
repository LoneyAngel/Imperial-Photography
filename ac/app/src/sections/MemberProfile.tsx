import { Member, Photo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface MemberProfileProps {
  currentMember: Member;
  photos: Photo[];
  onSave: (displayName: string, bio: string) => void;
}

export default function MemberProfile({ currentMember, photos, onSave }: MemberProfileProps) {
  const [displayName, setDisplayName] = useState(currentMember.displayName ?? '');
  const [bio, setBio] = useState(currentMember.bio ?? '');
  const [editing, setEditing] = useState(false);

  const myPhotos = photos.filter(p => p.ownerMemberId === currentMember.id);

  useEffect(() => {
    setDisplayName(currentMember.displayName ?? '');
    setBio(currentMember.bio ?? '');
  }, [currentMember]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(displayName, bio);
    setEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                  {(displayName || currentMember.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm font-medium truncate">{currentMember.email}</p>
                </div>
              </div>
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">个人名称</p>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
                        setDisplayName(currentMember.displayName ?? '');
                        setBio(currentMember.bio ?? '');
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
                    <p className="text-sm font-medium break-words">{currentMember.displayName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">个人简介</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{currentMember.bio || '—'}</p>
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
          {myPhotos.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-lg p-6">
              暂无作品
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myPhotos.map(p => (
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
