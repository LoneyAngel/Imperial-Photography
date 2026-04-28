/**
 * 图片压缩工具
 * 将图片压缩到指定大小以内
 */

interface CompressOptions {
  maxSizeMB: number; // 最大文件大小（MB）
  maxWidthOrHeight?: number; // 最大宽高（像素）
  quality?: number; // 初始质量（0-1）
}

interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  quality: number;
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩结果
 */
export async function compressImage(file: File, options: CompressOptions): Promise<CompressResult> {
  const { maxSizeMB, maxWidthOrHeight = 4096, quality = 0.9 } = options;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const originalSize = file.size;

  // 如果文件已经小于目标大小，直接返回
  if (file.size <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: file.size,
      quality: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;

      // 如果需要缩放尺寸
      if (maxWidthOrHeight && (width > maxWidthOrHeight || height > maxWidthOrHeight)) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);

      // 逐步降低质量直到满足大小要求
      let currentQuality = quality;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('压缩失败'));
              return;
            }

            // 如果压缩后仍然太大且质量还可以降低
            if (blob.size > maxSizeBytes && currentQuality > 0.1) {
              currentQuality -= 0.1;
              tryCompress();
              return;
            }

            // 创建新文件
            const fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: blob.size,
              quality: currentQuality,
            });
          },
          'image/jpeg',
          currentQuality,
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 检查文件大小是否超过限制
 */
export function isFileOversized(file: File, maxSizeMB: number): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
