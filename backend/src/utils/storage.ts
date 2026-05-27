import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import OSS from 'ali-oss';
import sharp from 'sharp';

type PutResult = { url: string, key: string };
type PutImageResult = PutResult & { width: number, height: number, lowQualityUrl?: string, lowQualityKey?: string };
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || '4001'}`;

// ==================== ✨ 优化 1: 单例化 OSS 客户端（解决重复 new 的性能问题） ====================
let ossClient: OSS | null = null;

function getOssClient(): OSS | null {
  if (ossClient) return ossClient;

  if (
    (process.env.OSS_REGION || process.env.OSS_ENDPOINT) &&
    process.env.OSS_ACCESS_KEY_ID &&
    process.env.OSS_ACCESS_KEY_SECRET &&
    process.env.OSS_BUCKET
  ) {
    const rawRegion = process.env.OSS_REGION;
    const endpoint = process.env.OSS_ENDPOINT;
    const region = rawRegion ? normalizeRegion(rawRegion) : undefined;

    ossClient = new OSS({
      region,
      endpoint,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
    });
    return ossClient;
  }
  return null;
}

// 标准化 OSS 区域名称
function normalizeRegion(value: string) {
  return value.trim().replace(/^https?:\/\//, '').replace(/\.aliyuncs\.com$/i, '');
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
  const client = getOssClient();

  if (client) {
    // 上传到 OSS
    await client.put(key, buffer, {
      headers: { 'Content-Type': mime },
    });

    const baseUrl = getPublicBaseUrl();
    if (!baseUrl) throw new Error('OSS public base url is not configured');
    return { key, url: `${baseUrl}/${key}` };
  } else {
    // ==================== ✨ 优化 2: 使用 path.dirname 安全生成本地目录（修复本地 404 漏洞） ====================
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    // 统一处理 Windows 和 Linux 的路径分隔符
    const normalizedKey = key.replace(/\\/g, '/'); 
    const localPath = path.join(uploadsDir, normalizedKey);
    
    // 自动获取文件所在目录并创建
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);

    // 修复：返回正确的、包含 key 完整路径的本地 URL
    return { key, url: `${BASE_URL}/uploads/${normalizedKey}` };
  }
}

// 上传图片到 OSS 或本地文件系统，同时提取尺寸并生成低清图
export async function putImage(params: {
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<PutImageResult> {
  const fileExt = extFromMime(params.mime);
  const random = crypto.randomBytes(12).toString('hex');
  const key = `photos/high_${Date.now()}-${random}.${fileExt}`;

  // ==================== ✨ 优化 3: 规避 Sharp 状态污染，添加方向修正 ====================
  // 读取元数据时，同样建议加入 rotate()，确保获取的宽高是旋转正向后的宽高
  const metadata = await sharp(params.buffer).rotate().metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // 上传原图
  const originalResult = await uploadBuffer(params.buffer, key, params.mime);

  // 生成并上传低清图
  let lowQualityResult: PutResult | undefined;
  if (width > 0 && height > 0) {
    // ✨ 修复：基于原始 buffer 重新创建独立的 sharp 实例，并追加 .rotate() 修复低清图变横的问题
    const lowQualityBuffer = await sharp(params.buffer)
      .rotate() 
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
  const client = getOssClient();

  if (client) {
    await client.put(key, Buffer.from(params.content, 'utf-8'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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
  return { key: `notice/${fileName}`, url: `${BASE_URL}/uploads/notice/${fileName}` };
}

// 删除通知内容文件
export async function deleteNoticeContent(key: string): Promise<void> {
  const client = getOssClient();
  if (client) {
    await client.delete(key);
    return;
  }

  // 从本地文件系统删除
  const normalizedKey = key.replace('notice/', '');
  const localPath = path.resolve(process.cwd(), 'uploads', 'notice', normalizedKey);
  await fs.unlink(localPath).catch(() => {}); 
}

// 从 URL 获取图片缓冲区
export async function getImageBufferFromUrl(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith(BASE_URL)) {
      const relativePath = url.replace(`${BASE_URL}/uploads/`, '');
      const localPath = path.resolve(process.cwd(), 'uploads', relativePath);
      return await fs.readFile(localPath);
    }

    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}