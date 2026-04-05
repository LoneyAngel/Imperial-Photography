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
  role: number;
}

/**
 * 生成JWT Auth Token (30分钟过期)
 */
export function generateAuthToken(member: Member): string {
  const userRole = getUserRole(member.id);
  return jwt.sign(
    {
      userId: member.id,
      email: member.email,
      type: 'auth',
      role:userRole,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_AUTH_EXPIRES_IN,
    }
  );
}

/**
 * 生成JWT Refresh Token (15天过期)
 */
export function generateRefreshToken(member: Member): string {
  const userRole = getUserRole(member.id);
  return jwt.sign(
    {
      userId: member.id,
      email: member.email,
      type: 'refresh',
      role:userRole,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    }
  );
}

/**
 * 生成Auth Token和Refresh Token对
 */
export function generateTokenPair(member: Member): { authToken: string; refreshToken: string } {
  const authToken = generateAuthToken(member);
  const refreshToken = generateRefreshToken(member);
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

export const getUserRole = async (id: string)=>{
  const userRole = await prisma.UserRole.findUnique({
    where: { userId: id },
    select: { roleId: true }
  });
  return userRole?.roleId || 2;
}
