import { z } from "zod";

/**
 * Accept either `username` or `email` as the identifier (the service decides
 * which field to query). Password length is validated by the admin schema on
 * creation; here we only require non-empty.
 */
export const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().optional(),
    email: z.string().trim().toLowerCase().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: "username or email is required",
    path: ["username"],
  });
