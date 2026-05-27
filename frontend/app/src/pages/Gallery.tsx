import { X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Photo } from '@/types';

import ErrorBoundary from '@/components/error-boundary';
import InfinitePhotoGrid from '@/components/infinitePhotoGrid';
import Search from '@/components/search';
import PhotoGridSkeleton from '@/components/skeletons/PhotoGridSkeleton';

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isStale = searchQuery !== searchInput;

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  // 按键检测
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
  };

  return (
    <ErrorBoundary>
      <div className="container py-8 px-6">
        {/* 搜索栏 */}
        <Search
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchQuery={searchQuery}
          total={0} // 无限加载模式暂时不需要总数
          clearSearch={clearSearch}
        />
        <div
          className={`transition-opacity duration-300 ${isStale ? 'opacity-50' : 'opacity-100'}`}
        >
          <Suspense fallback={<PhotoGridSkeleton />}>
            <InfinitePhotoGrid searchQuery={searchQuery} setSelectedPhoto={setSelectedPhoto} />
          </Suspense>
        </div>
        {/* 显示选中照片 */}
        {selectedPhoto && (
          <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

// 点开照片后的界面
function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full">
          {/* 左侧：图片展示区 */}
          <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 relative">
            <img
              src={
                photo.url +
                '?x-oss-process=image/resize,m_lfit,w_1920,h_1920/quality,q_85/interlace,1/format,webp'
              }
              alt={photo.title}
              className="max-h-full max-w-full object-contain shadow-2xl"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="w-[350px] md:w-[400px] bg-white flex flex-col border-l border-slate-100">
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <h2 className="text-base font-bold text-slate-800">详细信息</h2>
              <button
                onClick={onClose}
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
                onClick={() => navigate(`/member/${photo.ownerMemberId}`)}
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                  <img
                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${photo?.ownerMemberId || photo?.ownerName || 'user'}`}
                    alt={photo?.ownerName}
                    className="transition-transform duration-300 hover:[transform:rotate(360deg)]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Artist
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {photo.ownerName || '匿名用户'}
                  </p>
                </div>
              </div>

              {/* 标题 */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Title
                </p>
                <p className="text-xl font-light text-slate-800 leading-tight">
                  {photo.title || 'Untitled Work'}
                </p>
              </div>

              {/* 介绍 */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Description
                </p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                  {photo.description || '这个作者很懒，什么都没有留下...'}
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
  );
}
