import { z } from "zod";
import { ROLES } from "@/features/auth";
import {
  createUserSchema,
  locationFormSchema,
  resetPasswordSchema,
  subscribeSchema,
  updateUserSchema,
} from "./forms";

/** Server Actions are public endpoints: the same schemas the forms use validate what actually arrives. */
const id = z.uuid();
const code = z.string().trim().min(1).max(40);

export const inputs = {
  createUser: z.tuple([createUserSchema]),
  updateUser: z.tuple([id, updateUserSchema.extend({ role: z.enum(ROLES) })]),
  resetPassword: z.tuple([id, resetPasswordSchema]),
  createLocation: z.tuple([locationFormSchema]),
  updateLocation: z.tuple([code, locationFormSchema.omit({ code: true, kind: true })]),
  subscribe: z.tuple([subscribeSchema]),
  idOnly: z.tuple([id]),
  topic: z.tuple([z.string().trim().min(1).max(80)]),
};
