import React, { useState, useEffect, useRef } from 'react';
import '@/styles/lazy-image.css'; // 引入对应的样式

interface LazyImageProps {
  src: string; // 高清原图地址
  placeholder: string; // 低清缩略图地址（可以是极小的图片 URL 或 Base64）
  alt?: string;
  aspectRatio?: number; // 宽高比
  title: string;
  ownerName: string | undefined;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder,
  alt = '',
  aspectRatio = 16 / 9,
  title = '',
  ownerName = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false); // 高清图是否加载完成
  const [shouldLoad, setShouldLoad] = useState(false); // 是否进入可视区，开始加载
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 使用 IntersectionObserver 实现懒加载
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          // 一旦开始加载，就解绑观察器，避免重复触发
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { rootMargin: '0px 0px 200px 0px' }, // 提前 200px 预加载
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return (
    <div
      className="lazy-image-container"
      ref={containerRef}
      style={{ aspectRatio: `${aspectRatio}` }} // 声明式防抖，撑开高度
      tabIndex={0}
    >
      <div>
        {/* 当高清图未加载完成，且还不需要隐藏时显示，展示低清图 */}
        <img
          src={placeholder}
          alt={alt}
          className={`lazy-image img-thumb ${isLoaded ? 'img-thumb-hidden' : ''}`}
        />

        {/* 当进入可视区后，才真正往 DOM 里写入 src 开始下载高清图片 */}
        {shouldLoad && (
          <img
            src={src}
            alt={alt}
            className={`lazy-image img-hd ${isLoaded ? 'is-loaded' : ''}`}
            onLoad={() => setIsLoaded(true)} // 监听加载完成
          />
        )}
      </div>
      <div className="lazy-image-modal">
        <footer className="flex items-center w-full flex-col">
          <div className="text-sm font-sans">{title}</div>
          <div className="text-sm font-mono">{ownerName}</div>
        </footer>
      </div>
    </div>
  );
};

export default LazyImage;

// 在已经缓存的情况下，较少动画
// 但有点卡，不知道为什么
// import React, { useState, useEffect, useRef } from 'react';
// import '@/styles/lazy-image.css'; // 引入对应的样式

// interface LazyImageProps {
//   src: string; // 高清原图地址
//   placeholder: string; // 低清缩略图地址（可以是极小的图片 URL 或 Base64）
//   alt?: string;
//   aspectRatio?: number; // 宽高比
//   title: string;
//   ownerName: string | undefined;
// }

// const LazyImage: React.FC<LazyImageProps> = ({
//   src,
//   placeholder,
//   alt = '',
//   aspectRatio = 16 / 9,
//   title = '',
//   ownerName = '',
// }) => {
//   const [isLoaded, setIsLoaded] = useState(false); // 高清图是否加载完成
//   const [shouldLoad, setShouldLoad] = useState(false); // 是否进入可视区，开始加载
//   const [isCached, setIsCached] = useState(false); // 是否进入可视区，开始加载
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     // 使用 IntersectionObserver 实现懒加载
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setShouldLoad(true);
//           // 一旦开始加载，就解绑观察器，避免重复触发
//           if (containerRef.current) {
//             observer.unobserve(containerRef.current);
//           }
//         }
//       },
//       { rootMargin: '0px 0px 200px 0px' }, // 提前 200px 预加载
//     );

//     if (containerRef.current) {
//       observer.observe(containerRef.current);
//     }

//     return () => {
//       observer.disconnect();
//     };
//   }, [src]);
//   const hdImageRef = (node: HTMLImageElement | null) => {
//     if (node && node.complete) {
//       setIsLoaded(true);
//       setIsCached(true);
//     }
//   };

//   return (
//     <div
//       className="lazy-image-container"
//       ref={containerRef}
//       style={{ aspectRatio: `${aspectRatio}` }} // 声明式防抖，撑开高度
//       tabIndex={0}
//     >
//       <div>
//         {/* 当高清图未加载完成，且还不需要隐藏时显示，展示低清图 */}
//         <img
//           src={placeholder}
//           alt={alt}
//           className={`lazy-image img-thumb ${isLoaded ? 'img-thumb-hidden' : ''} ${isCached ? 'no-transition' : ''}`}
//         />

//         {/* 当进入可视区后，才真正往 DOM 里写入 src 开始下载高清图片 */}
//         {shouldLoad && (
//           <img
//             ref={hdImageRef}
//             src={src}
//             alt={alt}
//             className={`lazy-image img-hd ${isLoaded ? 'is-loaded' : ''} ${isCached ? 'no-transition' : ''}`}
//             onLoad={() => setIsLoaded(true)} // 监听加载完成
//           />
//         )}
//       </div>
//       <div className="lazy-image-modal">
//         <footer className="flex items-center w-full flex-col">
//           <div className="text-sm font-sans">{title}</div>
//           <div className="text-sm font-mono">{ownerName}</div>
//         </footer>
//       </div>
//     </div>
//   );
// };
// export default LazyImage;
