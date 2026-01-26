import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Nombre de usuario es requerido'),
  password: z
    .string()
    .min(1, 'Contraseña es requerida'),
  rememberMe: z
    .boolean()
    .optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;
