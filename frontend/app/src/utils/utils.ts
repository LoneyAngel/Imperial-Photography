import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string, message?: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message || '链接已复制到剪贴板');
  } catch {
    toast.error('复制失败，请手动复制');
  }
}

export function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}
