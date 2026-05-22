import { useState, useEffect, useRef } from 'react';

type ScrollDirection = 'up' | 'down' | null;

export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);

  // 使用 useRef 记录上一次的滚动高度，避免其变化触发组件不必要的重新渲染
  const lastScrollTop = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // 1. 过滤掉 iOS 弹性滚动（橡皮筋效果）产生的负值
      if (currentScrollTop < 0) {
        ticking.current = false;
        return;
      }

      // 2. 检查滚动距离是否超过了设定的阈值（避免轻微手抖导致闪烁）
      if (Math.abs(currentScrollTop - lastScrollTop.current) < threshold) {
        ticking.current = false;
        return;
      }

      // 3. 判断滚动方向并更新状态
      if (currentScrollTop > lastScrollTop.current && currentScrollTop > 60) {
        setScrollDirection('down');
      } else if (currentScrollTop < lastScrollTop.current) {
        setScrollDirection('up');
      }

      // 4. 更新记录值
      lastScrollTop.current = currentScrollTop;
      ticking.current = false;
    };

    const onScroll = () => {
      // 使用 requestAnimationFrame 进行滚动事件节流
      if (!ticking.current) {
        window.requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    // 清除定时器，防止组件卸载后内存泄漏
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrollDirection;
}
