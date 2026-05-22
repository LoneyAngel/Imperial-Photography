import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import OSS from 'ali-oss';
import sharp from 'sharp';

type PutResult = { url: string, key: string };
type PutImageResult = PutResult & { width: number, height: number, lowQualityUrl?: string, lowQualityKey?: string };
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || '4001'}`;

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

// 上传缓冲区到 OSS 或本地
export async function uploadBuffer(buffer: Buffer, key: string, mime: string): Promise<PutResult> {
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

    await client.put(key, buffer, {
      headers: {
        'Content-Type': mime,
      },
    });

    const baseUrl = getPublicBaseUrl();
    if (!baseUrl) throw new Error('OSS public base url is not configured');
    return { key, url: `${baseUrl}/${key}` };
  }

  // 上传到本地文件系统
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const keyParts = key.split('/');
  let localPath = uploadsDir;
  for (let i = 0; i < keyParts.length - 1; i++) {
    localPath = path.join(localPath, keyParts[i]);
    await fs.mkdir(localPath, { recursive: true });
  }
  localPath = path.join(uploadsDir, keyParts[keyParts.length - 1]);
  await fs.writeFile(localPath, buffer);
  return { key, url: `${BASE_URL}/uploads/${keyParts.slice(1).join('/')}` };
}

// 上传图片到 OSS 或本地文件系统，同时提取尺寸并生成低清图
export async function putImage(params: {
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<PutImageResult> {
  const fileExt = extFromMime(params.mime);
  const random = crypto.randomBytes(12).toString('hex');
  const key = `photos/${Date.now()}-${random}.${fileExt}`;

  // 提取图片信息
  const image = sharp(params.buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // 上传原图
  const originalResult = await uploadBuffer(params.buffer, key, params.mime);

  // 生成并上传低清图
  let lowQualityResult: PutResult | undefined;
  if (width > 0 && height > 0) {
    const lowQualityBuffer = await image
      .resize(Math.min(width, 400), Math.min(height, 400), { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();

    const lowQualityKey = `photos/low_${Date.now()}-${random}.jpg`;
    lowQualityResult = await uploadBuffer(lowQualityBuffer, lowQualityKey, 'image/jpeg');
  }

  return {
    url: originalResult.url,
    key: originalResult.key,
    width,
    height,
    lowQualityUrl: lowQualityResult?.url,
    lowQualityKey: lowQualityResult?.key,
  };
}

// 保存通知内容到 OSS 或本地文件系统
export async function putNoticeContent(params: {
  content: string;
}): Promise<PutResult> {
  const random = crypto.randomBytes(12).toString('hex');
  const key = `notice/${Date.now()}-${random}.txt`;

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

    await client.put(key, params.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

    const baseUrl = getPublicBaseUrl();
    if (!baseUrl) throw new Error('OSS public base url is not configured');
    return { key, url: `${baseUrl}/${key}` };
  }

  // 保存到本地文件系统
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'notice');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = key.replace('notice/', '');
  const localPath = path.join(uploadsDir, fileName);
  await fs.writeFile(localPath, params.content, 'utf-8');
  return { key: fileName, url: `${BASE_URL}/uploads/notice/${fileName}` };
}

// 删除通知内容文件
export async function deleteNoticeContent(key: string): Promise<void> {
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
    await client.delete(key);
    return;
  }

  // 从本地文件系统删除
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'notice');
  const localPath = path.join(uploadsDir, key);
  await fs.unlink(localPath).catch(() => {}); // 忽略文件不存在错误
}

// 从 URL 获取图片缓冲区
export async function getImageBufferFromUrl(url: string): Promise<Buffer | null> {
  try {
    // 检查是否是本地 URL
    if (url.startsWith(BASE_URL)) {
      const relativePath = url.replace(`${BASE_URL}/uploads/`, '');
      const localPath = path.resolve(process.cwd(), 'uploads', relativePath);
      return await fs.readFile(localPath);
    }

    // 否则尝试下载
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
