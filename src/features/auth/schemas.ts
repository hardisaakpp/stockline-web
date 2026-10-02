import { z } from "zod";

export const PROVIDERS = ["Local", "Directory"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const ROLES = ["Buyer", "Supplier", "SupplierProduction"] as const;
export type Role = (typeof ROLES)[number];

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: z.enum(ROLES),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
  /** Where the account's credentials live: here (`Local`) or in the corporate directory. */
  provider: z.enum(PROVIDERS),
  permissions: z.array(z.string()),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.string(),
  user: userSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;
