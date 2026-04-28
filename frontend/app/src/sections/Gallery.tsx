import { Suspense, useDeferredValue, useEffect, useState } from 'react';
import { Photo } from '@/types';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useFunction } from '@/context/function';
import { X } from 'lucide-react';
import PhotoGrid from '@/components/Photocard';
import Pagination from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';
import PhotoGridSkeleton from '@/components/skeletons/PhotoGridSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import Search from '@/components/Search';

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;
  const [page, setPage] = useState(1);
  const { fetchPhotos } = useFunction();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['photos', searchQuery, page],
    queryFn: async () => fetchPhotos(searchQuery, page),
  });
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (data?.pageSize ?? 30));

  // 搜索防抖，重置到第1页
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhoto]);

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* 搜索栏 */}
        <Search
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchQuery={searchQuery}
          total={total}
          clearSearch={clearSearch}
        />
        <div
          className={`transition-opacity duration-300 ${isStale ? 'opacity-50' : 'opacity-100'}`}
        >
          <Suspense fallback={<PhotoGridSkeleton />}>
            <PhotoListContainer
              searchQuery={deferredQuery}
              page={page}
              setSelectedPhoto={setSelectedPhoto}
            />
          </Suspense>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        {/* 显示选中照片 */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-background shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full">
                {/* 左侧：图片展示区 */}
                <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 relative">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="max-h-full max-w-full object-contain shadow-2xl"
                  />
                </div>
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
                  {/* 内容区 */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* 作者 */}
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/member/${selectedPhoto.ownerMemberId}`)}
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        <img
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedPhoto?.ownerMemberId || selectedPhoto?.ownerName || 'user'}`}
                          alt={selectedPhoto?.ownerName}
                          className="transition-transform duration-300 hover:[transform:rotate(360deg)]"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Artist
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedPhoto.ownerName || '匿名用户'}
                        </p>
                      </div>
                    </div>

                    {/* 标题 */}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Title
                      </p>
                      <p className="text-xl font-light text-slate-800 leading-tight">
                        {selectedPhoto.title || 'Untitled Work'}
                      </p>
                    </div>

                    {/* 介绍 */}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Description
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                        {selectedPhoto.description || '这个作者很懒，什么都没有留下...'}
                      </p>
                    </div>
                  </div>

                  {/* 下载
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                      下载原图
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function PhotoListContainer({ searchQuery, page, setSelectedPhoto }: any) {
  const { fetchPhotos } = useFunction();
  const { data } = useSuspenseQuery({
    queryKey: ['photos', searchQuery, page],
    queryFn: async () => fetchPhotos(searchQuery, page),
  });

  const photos = data?.list ?? [];

  if (photos.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">未找到匹配作品</div>;
  }

  return <PhotoGrid photos={photos} setSelectedPhoto={setSelectedPhoto} />;
}
