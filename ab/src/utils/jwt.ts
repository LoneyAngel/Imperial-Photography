import jwt from 'jsonwebtoken';
import { Member } from '@prisma/client';
import { prisma } from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_AUTH_EXPIRES_IN = process.env.JWT_AUTH_EXPIRES_IN || '30m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '15d';

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'auth' | 'refresh';
  roleId: number;
}

/**
 * 获取用户角色
 */
async function getUserRoleId(userId: string): Promise<number> {
  const userRole = await prisma.userRole.findUnique({
    where: { userId },
    select: { roleId: true }
  });
  return userRole?.roleId ?? 2; // 默认 user 角色
}

/**
 * 生成JWT Auth Token (30分钟过期)
 */
export async function generateAuthToken(member: Member): Promise<string> {
  const roleId = await getUserRoleId(member.id);
  return jwt.sign(
    {
      userId: member.id,
      email: member.email,
      type: 'auth',
      roleId,
    },
    JWT_SECRET,
    { expiresIn: JWT_AUTH_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * 生成JWT Refresh Token (15天过期)
 */
export async function generateRefreshToken(member: Member): Promise<string> {
  const roleId = await getUserRoleId(member.id);
  return jwt.sign(
    {
      userId: member.id,
      email: member.email,
      type: 'refresh',
      roleId,
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * 生成Auth Token和Refresh Token对
 */
export async function generateTokenPair(member: Member): Promise<{ authToken: string; refreshToken: string }> {
  const authToken = await generateAuthToken(member);
  const refreshToken = await generateRefreshToken(member);
  return {
    authToken,
    refreshToken,
  };
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 从请求头中提取Token
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // 移除 'Bearer ' 前缀
}