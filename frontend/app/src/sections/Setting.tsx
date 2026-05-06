// 可以进行一些用户个性化配置

import { ThemeToggle } from '@/components/theme-toggle';

// 例如：是否暴露email给公众，以及ui风格，
export default function Setting() {
  return (
    <div className="flex flex-row p-2">
      <ThemeToggle />
    </div>
  );
}
