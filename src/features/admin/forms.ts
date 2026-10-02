import { z } from "zod";
import { ROLES } from "@/features/auth";

/** Validation messages are catalog keys under `admin.users.validation`; the form translates them. */
export const MIN_PASSWORD_LENGTH = 10;

export const createUserSchema = z.object({
  email: z.string().trim().pipe(z.email("emailInvalid")),
  displayName: z.string().trim().min(1, "nameRequired").max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH, "passwordShort"),
  role: z.enum(ROLES),
  isAdmin: z.boolean(),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1, "nameRequired").max(200),
  role: z.enum(ROLES),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
});
export type UpdateUserValues = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, "passwordShort"),
});
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const locationFormSchema = z.object({
  code: z.string().trim().min(1, "codeRequired").max(40),
  name: z.string().trim().min(1, "nameRequired").max(200),
  kind: z.enum(["Warehouse", "Store"]),
  supplyingWarehouseCode: z.string().nullable(),
  isActive: z.boolean(),
});
export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const subscribeSchema = z.object({
  email: z.string().trim().pipe(z.email("emailInvalid")),
  topic: z.string().min(1),
});
export type SubscribeValues = z.infer<typeof subscribeSchema>;

/** Whether removing admin access (or disabling) this user would leave the system without an active administrator. */
export function isLastActiveAdmin(
  user: { id: string; isAdmin: boolean; isActive: boolean },
  users: readonly { id: string; isAdmin: boolean; isActive: boolean }[],
) {
  const activeAdmins = users.filter((u) => u.isAdmin && u.isActive);
  return (
    user.isAdmin && user.isActive && activeAdmins.length === 1 && activeAdmins[0]?.id === user.id
  );
}

/** Starting values of the location form: the location being edited, or a new active store supplied by the first warehouse. */
export function locationDefaults(
  location: {
    code: string;
    name: string;
    kind: "Warehouse" | "Store";
    supplyingWarehouseCode: string | null;
    isActive: boolean;
  } | null,
  warehouses: readonly { code: string }[],
): LocationFormValues {
  if (location) return { ...location };
  return {
    code: "",
    name: "",
    kind: "Store",
    supplyingWarehouseCode: warehouses[0]?.code ?? null,
    isActive: true,
  };
}
