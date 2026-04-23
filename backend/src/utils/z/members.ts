import { z } from 'zod';

export const updateMemberSchema = z.object({
  name: z.string().trim().max(20).optional(),
  bio: z.string().trim().max(500).optional(),
});

export const updateRoleSchema = z.object({
  roleId: z.number().int().min(1).max(3),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});
