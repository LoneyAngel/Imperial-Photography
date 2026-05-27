import { Suspense, useEffect, useState } from 'react';

import type { Photo } from '@/types';

import ErrorBoundary from '@/components/error-boundary';
import InfinitePhotoGrid from '@/components/infinitePhotoGrid';
import { PhotoModal } from '@/components/photo-modal';
import Search from '@/components/search';
import PhotoGridSkeleton from '@/components/skeletons/PhotoGridSkeleton';
import { useFunction } from '@/context/function';

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isStale = searchQuery !== searchInput;
  const { fetchPhotos } = useFunction();

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
            <InfinitePhotoGrid
              searchQuery={searchQuery}
              setSelectedPhoto={setSelectedPhoto}
              fetchFn={fetchPhotos}
            />
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
