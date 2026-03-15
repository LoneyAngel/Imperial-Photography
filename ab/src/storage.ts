import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import OSS from 'ali-oss';

type PutResult = { url: string; key: string };

// 检查是否配置了 OSS 存储
function hasOssConfig() {
  return Boolean(
    (process.env.OSS_REGION || process.env.OSS_ENDPOINT) &&
      process.env.OSS_ACCESS_KEY_ID &&
      process.env.OSS_ACCESS_KEY_SECRET &&
      process.env.OSS_BUCKET
  );
}

// 标准化 OSS 区域名称
function normalizeRegion(value: string) {
  const trimmed = value.trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const withoutSuffix = withoutProtocol.replace(/\.aliyuncs\.com$/i, '');
  return withoutSuffix;
}

// 获取 OSS 公共基础 URL
function getPublicBaseUrl() {
  if (process.env.OSS_PUBLIC_BASE_URL) return process.env.OSS_PUBLIC_BASE_URL.replace(/\/+$/, '');
  const rawRegion = process.env.OSS_REGION;
  const bucket = process.env.OSS_BUCKET;
  if (!rawRegion || !bucket) return null;
  const region = normalizeRegion(rawRegion);
  return `https://${bucket}.${region}.aliyuncs.com`;
}

// 从 MIME 类型获取文件扩展名
function extFromMime(mime: string) {
  const lower = mime.toLowerCase();
  if (lower === 'image/jpeg') return 'jpg';
  if (lower === 'image/png') return 'png';
  if (lower === 'image/gif') return 'gif';
  if (lower === 'image/webp') return 'webp';
  return 'bin';
}

// 上传图片到 OSS 或本地文件系统
export async function putImage(params: {
  buffer: Buffer;
  mime: string;
  originalName?: string;
  publicBaseUrlForLocal: string;
}): Promise<PutResult> {
  const fileExt = extFromMime(params.mime);
  const random = crypto.randomBytes(12).toString('hex');
  const key = `photos/${Date.now()}-${random}.${fileExt}`;

  // 上传到 OSS
  if (hasOssConfig()) {
    const rawRegion = process.env.OSS_REGION;
    const endpoint = process.env.OSS_ENDPOINT;
    const region = rawRegion ? normalizeRegion(rawRegion) : undefined;
    const client = new OSS({
      region,
      endpoint,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
    });

    await client.put(key, params.buffer, {
      headers: {
        'Content-Type': params.mime,
      },
    });

    const baseUrl = getPublicBaseUrl();
    if (!baseUrl) throw new Error('OSS public base url is not configured');
    return { key, url: `${baseUrl}/${key}` };
  }

  // 上传到本地文件系统
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = key.replace('photos/', '');
  const localPath = path.join(uploadsDir, fileName);
  await fs.writeFile(localPath, params.buffer);
  return { key: fileName, url: `${params.publicBaseUrlForLocal}/uploads/${fileName}` };
}
