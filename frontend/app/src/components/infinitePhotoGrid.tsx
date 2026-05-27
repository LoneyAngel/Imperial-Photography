import { useInfiniteQuery } from '@tanstack/react-query';
import { Masonry, useInfiniteLoader } from 'masonic'; // 引入虚拟瀑布流

import LazyImage from './lazy-picture';

import type { Photo } from '@/types';

interface InfinitePhotoGridProps {
  searchQuery: string;
  setSelectedPhoto: (photo: Photo | null) => void;
  fetchFn: (
    search: string,
    page: number,
  ) => Promise<{
    list: Photo[];
    total: number;
    page: number;
    pageSize: number;
  }>;
}

export default function InfinitePhotoGrid({
  searchQuery,
  setSelectedPhoto,
  fetchFn,
}: InfinitePhotoGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['photos', searchQuery],
    queryFn: async ({ pageParam }) => {
      return fetchFn(searchQuery, pageParam);
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.pageSize) ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // 1. 扁平化数据
  const photos = data?.pages.flatMap((page) => page.list) ?? [];

  // 2. 使用 masonic 的无限加载连接器（它代替了你原本的 IntersectionObserver）
  const maybeLoadMore = useInfiniteLoader(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    {
      isItemLoaded: (index, items) => index < items.length,
      minimumBatchSize: 10,
      threshold: 3, // 提前 3 个元素进入视野时就触发加载
    },
  );

  // 3. 定义单个图片卡片的渲染组件（Masonic 要求的固定格式）
  const PhotoCard = ({ data: photo }: { data: Photo }) => {
    const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
    const placeholder = photo.lowQualityUrl || photo.url;

    return (
      <div onClick={() => setSelectedPhoto(photo)} key={photo.id}>
        <LazyImage
          src={
            photo.url + '?x-oss-process=image/resize,m_lfit,w_1000,h_1000/interlace,1/format,webp'
          }
          placeholder={
            placeholder +
            '?x-oss-process=image/resize,m_lfit,w_1000,h_1000/quality,q_85/format,webp'
          }
          alt={photo.title}
          aspectRatio={aspectRatio}
          ownerName={photo?.ownerName}
          title={photo.title}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-muted aspect-[4/3] rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">未找到匹配作品</div>;
  }

  return (
    <div>
      {/* 4. 替换核心瀑布流组件 */}
      <Masonry
        items={photos}
        columnWidth={300} // 每一列的最小宽度，它会自动根据屏幕宽度计算列数（响应式）
        columnGutter={24} // 列与列，行与行之间的间距
        render={PhotoCard} // 渲染子项
        onRender={maybeLoadMore} // 绑定滚动监听
      />

      {/* 底部状态提示 */}
      {isFetchingNextPage && (
        <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
          正在加载更多作品...
        </div>
      )}
      {!hasNextPage && photos.length > 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">已加载全部作品</div>
      )}
    </div>
  );
}
