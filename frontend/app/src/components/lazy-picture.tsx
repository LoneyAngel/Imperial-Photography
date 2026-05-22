import React, { useState, useEffect, useRef } from 'react';
import '@/styles/lazy-iamge.css'; // 引入对应的样式

interface LazyImageProps {
  src: string; // 高清原图地址
  placeholder: string; // 低清缩略图地址（可以是极小的图片 URL 或 Base64）
  alt?: string;
  aspectRatio?: number; // 宽高比
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder,
  alt = '',
  aspectRatio = 16 / 9,
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
    >
      {/* 当高清图未加载完成，且还不需要隐藏时显示，展示低清图 */}
      <img
        src={placeholder}
        alt={alt}
        className={`img-thumb ${isLoaded ? 'img-thumb-hidden' : ''}`}
      />

      {/* 当进入可视区后，才真正往 DOM 里写入 src 开始下载高清图片 */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`img-hd ${isLoaded ? 'is-loaded' : ''}`}
          onLoad={() => setIsLoaded(true)} // 监听加载完成
        />
      )}
    </div>
  );
};

export default LazyImage;
// 感觉有点卡
// import React, { useState, useEffect, useRef } from 'react';
// import '@/styles/lazy-iamge.css'; // 引入对应的样式

// interface LazyImageProps {
//   src: string;       // 高清原图地址
//   placeholder: string; // 低清缩略图地址（可以是极小的图片 URL 或 Base64）
//   alt?: string;
//   aspectRatio?: number; // 宽高比
// }

// const LazyImage: React.FC<LazyImageProps> = ({
//   src,
//   placeholder,
//   alt = '',
//   aspectRatio = 16 / 9,
// }) => {
//   const [isLoaded, setIsLoaded] = useState(false);   // 高清图是否加载完成
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
//       { rootMargin: '0px 0px 200px 0px' } // 提前 200px 预加载
//     );

//     if (containerRef.current) {
//       observer.observe(containerRef.current);
//     }

//     return () => {
//       observer.disconnect();
//     };
//   }, [src]);
//   const hdImageRef = (node : HTMLImageElement|null)=>{
//     if(node&&node.complete){
//       setIsLoaded(true);
//       setIsCached(true);
//     }
//   }

//   return (
//     <div
//       className="lazy-image-container"
//       ref={containerRef}
//       style={{ aspectRatio: `${aspectRatio}` }} // 声明式防抖，撑开高度
//     >
//       {/* 当高清图未加载完成，且还不需要隐藏时显示，展示低清图 */}
//       <img
//         src={placeholder}
//         alt={alt}
//         className={`img-thumb ${isLoaded ? 'img-thumb-hidden' : ''} ${isCached?'no-transition':''}`}
//       />

//       {/* 当进入可视区后，才真正往 DOM 里写入 src 开始下载高清图片 */}
//       {shouldLoad && (
//         <img
//           ref={hdImageRef}
//           src={src}
//           alt={alt}
//           className={`img-hd ${isLoaded ? 'is-loaded' : ''} ${isCached?'no-transition':''}`}
//           onLoad={() => setIsLoaded(true)} // 监听加载完成
//         />
//       )}
//     </div>
//   );
// };

// export default LazyImage;
