// import { useCallback, useRef } from 'react';
// import { useInfiniteQuery } from '@tanstack/react-query';
// import { Photo } from '@/types';
// import { useFunction } from '@/context/function';
// import Masonry from 'react-masonry-css';
// import '@/styles/PhotoGrid.css';
// import LazyImage from './lazy-picture';

// // 修复 React-Masonry-CSS 的默认导入问题
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const MasonryComponent = (Masonry as any).default ? (Masonry as any).default : Masonry;

// const breakpointColumnsObj = {
//   default: 3,
//   1100: 3,
//   700: 2,
//   500: 1,
// };

// interface InfinitePhotoGridProps {
//   searchQuery: string;
//   setSelectedPhoto: (photo: Photo | null) => void;
// }

// export default function InfinitePhotoGrid({
//   searchQuery,
//   setSelectedPhoto,
// }: InfinitePhotoGridProps) {
//   const { fetchPhotos } = useFunction();
//   const observerRef = useRef<IntersectionObserver | null>(null);

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
//     queryKey: ['photos', searchQuery],
//     queryFn: async ({ pageParam }) => {
//       return fetchPhotos(searchQuery, pageParam);
//     },
//     getNextPageParam: (lastPage) => {
//       const nextPage = lastPage.page + 1;
//       return nextPage <= Math.ceil(lastPage.total / lastPage.pageSize) ? nextPage : undefined;
//     },
//     initialPageParam: 1,
//   });

//   const lastItemRef = useCallback(
//     (node: HTMLDivElement | null) => {
//       if (isFetchingNextPage) return;
//       if (observerRef.current) observerRef.current.disconnect();
//       observerRef.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasNextPage) {
//           fetchNextPage();
//         }
//       });
//       if (node) observerRef.current.observe(node);
//     },
//     [isFetchingNextPage, hasNextPage, fetchNextPage],
//   );

//   // 合并所有页面的数据
//   const photos = data?.pages.flatMap((page) => page.list) ?? [];

//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
//         {Array.from({ length: 9 }).map((_, i) => (
//           <div key={i} className="bg-muted aspect-[4/3] rounded-lg" />
//         ))}
//       </div>
//     );
//   }

//   if (photos.length === 0) {
//     return <div className="text-center py-16 text-muted-foreground">未找到匹配作品</div>;
//   }

//   const items = photos.map((photo, index) => {
//     const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
//     const placeholder = photo.lowQualityUrl || photo.url;
//     const isLastItem = index === photos.length - 1;

//     return (
//       <div
//         key={photo.id}
//         ref={isLastItem ? lastItemRef : undefined}
//         className="photo-item"
//         onClick={() => setSelectedPhoto(photo)}
//       >
//         <LazyImage
//           src={photo.url}
//           placeholder={placeholder}
//           alt={photo.title}
//           aspectRatio={aspectRatio}
//         />
//       </div>
//     );
//   });

//   return (
//     <div>
//       <MasonryComponent
//         breakpointCols={breakpointColumnsObj}
//         className="my-masonry-grid"
//         columnClassName="my-masonry-grid_column"
//       >
//         {items}
//       </MasonryComponent>
//       {isFetchingNextPage && (
//         <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
//           正在加载更多作品...
//         </div>
//       )}
//       {!hasNextPage && photos.length > 0 && (
//         <div className="text-center py-8 text-xs text-muted-foreground">已加载全部作品</div>
//       )}
//     </div>
//   );
// }
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Photo } from '@/types';
import { useFunction } from '@/context/function';
import { Masonry, useInfiniteLoader } from 'masonic'; // 引入虚拟瀑布流
import LazyImage from './lazy-picture';

interface InfinitePhotoGridProps {
  searchQuery: string;
  setSelectedPhoto: (photo: Photo | null) => void;
}

export default function InfinitePhotoGrid({
  searchQuery,
  setSelectedPhoto,
}: InfinitePhotoGridProps) {
  const { fetchPhotos } = useFunction();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['photos', searchQuery],
    queryFn: async ({ pageParam }) => {
      return fetchPhotos(searchQuery, pageParam);
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.pageSize) ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // 1. 扁平化数据
  const photos = useMemo(() => data?.pages.flatMap((page) => page.list) ?? [], [data]);

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
      <div
        className="photo-item"
        style={{ cursor: 'pointer', marginBottom: '16px' }} // 间距改由样式控制
        onClick={() => setSelectedPhoto(photo)}
      >
        <LazyImage
          src={photo.url}
          placeholder={placeholder}
          alt={photo.title}
          aspectRatio={aspectRatio}
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
        columnGutter={16} // 列与列之间的间距
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
