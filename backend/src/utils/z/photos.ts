import { z } from 'zod';

export const photoQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export const PhotoSchema = z.object({
  title: z.string().trim().max(200).default(''),
  description: z.string().trim().max(2000).optional(),
});

export const adminPhotoFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().trim().max(100).optional(),
});

export const updatePhotoStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

export const adminPhotoQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});