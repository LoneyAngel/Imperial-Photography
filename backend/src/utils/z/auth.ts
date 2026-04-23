import { z } from 'zod';
const emailbase = z.string().trim().toLowerCase().pipe(z.email());
const codebase = z.string().length(6).regex(/^\d+$/);
const passwordbase = z.string().min(6);
// 邮箱验证
export const emailSchema =z.object({
  email: emailbase
});
export const emailAndCodeSchema = emailSchema.extend({
  code: codebase
});
export const emailAndPasswordSchema = emailSchema.extend({
  password: passwordbase
});