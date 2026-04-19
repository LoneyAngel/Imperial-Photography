// prisma.config.ts
import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
dotenv.config();
export default defineConfig({
  datasource: {
    // 这里的 url 对应你 .env 里的变量
    url: process.env.DATABASE_URL,
  },
});