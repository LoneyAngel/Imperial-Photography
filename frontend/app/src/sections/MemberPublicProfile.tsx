import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Photo } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { X, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/ui/pagination';
import api from '@/utils/axios';
import { copyToClipboard, buildUrl } from '@/utils/utils';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPhotoId = searchParams.get('photo') || null;

  const [page, setPage] = useState(currentPage);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [hasSelectedOnce, setHasSelectedOnce] = useState(false);

  const { data } = useQuery({
    queryKey: ['member-photos', id, page],
    queryFn: () => fetchMemberPhotos(id!, page),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const photos = data?.list ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 30));

  // 从URL中初始化选中的照片 - 只执行一次
  useEffect(() => {
    if (currentPhotoId && photos.length > 0 && !selectedPhoto && !hasSelectedOnce) {
      const photo = photos.find((p) => p.id === currentPhotoId);
      if (photo) {
        setSelectedPhoto(photo);
        setHasSelectedOnce(true);
      }
    }
  }, [currentPhotoId, photos, selectedPhoto, hasSelectedOnce]);

  // 更新URL - 只有当值与URL当前值不同时才更新
  useEffect(() => {
    if (!id) return;

    const newPhotoId = selectedPhoto?.id || undefined;
    const newPage = page > 1 ? page : undefined;

    // 检查是否真的需要更新URL
    const urlPage = searchParams.get('page');
    const urlPhotoId = searchParams.get('photo') || undefined;

    const urlPageNum = urlPage ? parseInt(urlPage, 10) : undefined;

    if (
      newPage === urlPageNum &&
      newPhotoId === urlPhotoId
    ) {
      return; // URL已经是正确状态
    }

    const params: Record<string, string> = {};
    if (newPage) params.page = String(newPage);
    if (newPhotoId) params.photo = newPhotoId;

    setSearchParams(params, { replace: true });
  }, [id, page, selectedPhoto?.id, searchParams]);

  const handleSharePhoto = (photo: Photo) => {
    if (!id) return;
    const url = buildUrl(`/member/${id}`, {
      page: page > 1 ? page : undefined,
      photo: photo.id,
    });
    copyToClipboard(url, '作品链接已复制');
  };

  const handleShareProfile = () => {
    if (!id) return;
    const url = buildUrl(`/member/${id}`, {});
    copyToClipboard(url, '个人主页链接已复制');
  };

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
        <div className="flex-1">
          <p className="text-xl font-semibold">{data?.member.name ?? '加载中...'}</p>
          {data?.member.bio && (
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{data.member.bio}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">共 {data?.total ?? 0} 件作品</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareProfile}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          分享
        </Button>
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
                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                  <Button
                    className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleSharePhoto(selectedPhoto)}
                  >
                    <Share2 className="h-4 w-4" />
                    分享作品
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
