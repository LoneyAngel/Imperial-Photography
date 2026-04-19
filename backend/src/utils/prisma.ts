import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
console.log('DATABASE_URL:', process.env.DATABASE_URL);
// 1. 创建 pg 连接池
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL ,
});

// 2. 创建 Prisma 适配器
const adapter = new PrismaPg(pool);

// 3. 将适配器注入客户端
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});





