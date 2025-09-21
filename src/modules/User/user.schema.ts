import { z } from "zod";

export const CreateUserPayloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  profile: z.string().optional(),
  uuid: z.string(),
});

export const VerifyTokenPayloadSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;
export type VerifyTokenPayload = z.infer<typeof VerifyTokenPayloadSchema>;
