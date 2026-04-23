import { z } from 'zod';

export const NoticeSchema = z.object({
  title: z.string().trim().min(1).max(50),
  content: z.string().trim().max(2000),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});
