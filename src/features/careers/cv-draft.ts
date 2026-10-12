import { cvSchema, type Cv } from "./schemas";

/** An unsaved copy of the CV kept in this browser. */
export type CvDraft = { cv: Cv; savedAt: number };

/** One draft per person: on a shared computer another account must never see it. */
export const draftKey = (userId: string) => `stockline.careers.cv-draft.${userId}`;

/** The raw stored text, or null: storage can be blocked (private windows), and the editor works without it. */
export function readRaw(userId: string): string | null {
  try {
    return window.localStorage.getItem(draftKey(userId));
  } catch {
    return null;
  }
}

/** A draft only counts if it still is a valid CV; anything corrupt or from an older shape is ignored. */
export function parseDraft(raw: string | null): CvDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { cv, savedAt } = value as { cv?: unknown; savedAt?: unknown };
    const parsed = cvSchema.safeParse(cv);
    return parsed.success && typeof savedAt === "number" ? { cv: parsed.data, savedAt } : null;
  } catch {
    return null;
  }
}

export function writeDraft(userId: string, cv: Cv, now = Date.now()): void {
  try {
    window.localStorage.setItem(draftKey(userId), JSON.stringify({ cv, savedAt: now }));
  } catch {
    // ignore: the draft is a safety net, not the save
  }
}

export function clearDraft(userId: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId));
  } catch {
    // ignore
  }
}
