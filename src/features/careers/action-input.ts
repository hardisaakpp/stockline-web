import { z } from "zod";
import { cvSchema, MAX_IMPORT_BYTES, preferencesSchema } from "./schemas";

/** Server Actions are public endpoints: what arrives is validated again, here, before anything is forwarded. */
const id = z.uuid();

export const inputs = {
  saveCv: z.tuple([cvSchema]),
  previewCv: z.tuple([cvSchema]),
  none: z.tuple([]),
  importFile: z.tuple([z.instanceof(File).refine((f) => f.size <= MAX_IMPORT_BYTES)]),
  savePreferences: z.tuple([preferencesSchema]),
  refreshOffers: z.tuple([z.boolean()]),
  prepare: z.tuple([id]),
  editLetter: z.tuple([id, z.string().max(8000)]),
  act: z.tuple([id, z.enum(["confirm", "sent", "discard"])]),
  idOnly: z.tuple([id]),
};
