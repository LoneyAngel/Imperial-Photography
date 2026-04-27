import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Photo } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Pagination from '@/components/ui/pagination';
import api from '@/utils/axios';

interface MemberPhotosResult {
  member: { name: string; bio?: string };
  list: Photo[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchMemberPhotos(memberId: string, page: number): Promise<MemberPhotosResult | null> {
  try {
    const res = await api.get(`/photos/member/${memberId}?page=${page}`);
    return res.data.data as MemberPhotosResult;
  } catch {
    return null;
  }
}

export default function MemberPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const { data } = useQuery({
    queryKey: ['member-photos', id, page],
    queryFn: () => fetchMemberPhotos(id!, page),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const photos = data?.list ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 30));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 作者信息 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500">
          <img
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${id ||'user'}`}
            alt={id}
            className="transition-transform duration-300 hover:[transform:rotate(360deg)]"
          />
        </div>
        <div>
          <p className="text-xl font-semibold">{data?.member.name ?? '加载中...'}</p>
          {data?.member.bio && (
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{data.member.bio}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">共 {data?.total ?? 0} 件作品</p>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">暂无作品</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedPhoto(p)}>
                <CardContent className="pt-4">
                  <img
                    src={p.url}
                    alt={p.title || '未命名作品'}
                    className="w-full h-40 object-cover mb-3"
                  />
                  <p className="text-sm font-medium truncate">{p.title || '未命名作品'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* 照片详情弹窗 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-background shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full">
              <div className="flex-1 bg-slate-100 flex items-center justify-center p-6">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-h-full max-w-full object-contain shadow-2xl"
                />
              </div>
              <div className="w-[350px] md:w-[400px] bg-white flex flex-col border-l border-slate-100">
                <div className="p-6 flex items-center justify-between border-b border-slate-50">
                  <h2 className="text-base font-bold text-slate-800">详细信息</h2>
                  <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Title</p>
                    <p className="text-xl font-light text-slate-800 leading-tight">{selectedPhoto.title || 'Untitled Work'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      {selectedPhoto.description || '这个作者很懒，什么都没有留下...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
