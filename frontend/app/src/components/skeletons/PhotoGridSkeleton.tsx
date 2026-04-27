import Masonry from 'react-masonry-css';

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

const PhotoGridSkeleton = () => {
  // 生成一组随机高度，模拟瀑布流的不规则感
  const skeletonItems = Array.from({ length: 12 }).map((_, i) => {
    // 随机高度：例如 200px, 300px, 400px
    const heights = ['h-48', 'h-64', 'h-80', 'h-72', 'h-96'];
    const randomHeight = heights[i % heights.length];

    return (
      <div key={i} className="mb-4 break-inside-avoid">
        <div className={`w-full ${randomHeight} bg-slate-200 rounded-xl animate-pulse`}>
          {/* 这里可以加一个模拟图片的占位图标 */}
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        {/* 模拟下方的标题/文字 */}
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  });

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {skeletonItems}
    </Masonry>
  );
};

export default PhotoGridSkeleton;