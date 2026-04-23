/*
测试数据库状态
*/
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
// 1. 强制使用绝对路径加载 env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ 无法找到 .env.local 文件:', result.error);
}
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL ,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// 哈希验证码
function hashVerificationCode(email, code) {
  const secret = 'dev-secret';
  const input = `${email}:${code}:${secret}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}
async function testDatabase() { 
    const existingMember = await prisma.emailVerificationCode.findMany({
    });
    console.log('Database connection successful. Existing records:', existingMember);
}
async function testCreateCode() {
    const email = '2670696747@qq.com';
    const code = 123456;
    const codeHash = await hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
    const res = await prisma.emailVerificationCode.upsert({
        where: { email },
        update: {
            codeHash,
            expiresAt,
            attempts: 0,
        },
        create: {
            email,
            codeHash,
            expiresAt,
            attempts: 0,
        },
    });
    console.log('Upserted verification code:', res);
}

testCreateCode()