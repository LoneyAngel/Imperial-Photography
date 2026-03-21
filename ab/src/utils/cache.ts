// 暂时没有用到

// 简单的内存缓存工具
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟

  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    const createdAt = Date.now();

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期的缓存项
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计信息
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // 简化版本，实际可以添加命中统计
    };
  }
}

// 全局缓存实例
export const cache = new MemoryCache();

// 自动清理过期缓存（每5分钟）
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// 缓存装饰器
export function cached<T>(ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cachedResult = cache.get<T>(cacheKey);

      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// 常用的缓存键生成器
export const CacheKeys = {
  photos: () => 'photos:all',
  photosByMember: (memberId: string) => `photos:member:${memberId}`,
  member: (email: string) => `member:${email}`,
};

// 缓存辅助函数
export const cacheHelper = {
  getOrSet: async <T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    cache.set(key, result, ttl);
    return result;
  },

  invalidate: (pattern: string): void => {
    // 简化版本，实际可以支持模式匹配
    cache.delete(pattern);
  },

  invalidatePrefix: (prefix: string): void => {
    // 清理指定前缀的所有缓存
    for (const key of cache['cache'].keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },
};