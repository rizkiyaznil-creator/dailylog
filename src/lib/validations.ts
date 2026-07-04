import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const apiKeysSchema = z.object({
  // Empty string = leave unchanged; the literal "__CLEAR__" = remove the key.
  openaiKey: z.string().max(300).optional(),
  anthropicKey: z.string().max(300).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
