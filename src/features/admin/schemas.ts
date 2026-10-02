import { z } from "zod";
import { userSchema } from "@/features/auth";

export const usersSchema = z.array(userSchema);

export const rolesSchema = z.object({
  roles: z.array(z.object({ role: z.string(), permissions: z.array(z.string()) })),
  adminPermissions: z.array(z.string()),
  allPermissions: z.array(z.string()),
});
export type RolesMatrix = z.infer<typeof rolesSchema>;

export const locationSchema = z.object({
  code: z.string(),
  name: z.string(),
  kind: z.enum(["Warehouse", "Store"]),
  supplyingWarehouseCode: z.string().nullable(),
  isActive: z.boolean(),
});
export type Location = z.infer<typeof locationSchema>;
export const locationsSchema = z.array(locationSchema);

export const topicSchema = z.object({
  topic: z.string(),
  audience: z.string(),
  subject: z.string(),
  description: z.string(),
});
export type EmailTopic = z.infer<typeof topicSchema>;
export const topicsSchema = z.array(topicSchema);

export const subscriptionSchema = z.object({
  id: z.string(),
  email: z.string(),
  topic: z.string(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;
export const subscriptionsSchema = z.array(subscriptionSchema);

export const previewSchema = z.object({ subject: z.string(), html: z.string(), text: z.string() });
export type EmailPreview = z.infer<typeof previewSchema>;
