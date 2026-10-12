import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { clearDraft, parseDraft, readRaw, writeDraft, type CvDraft } from "./cv-draft";
import type { Cv } from "./schemas";

/** Quiet time after the last keystroke before the draft is written. */
export const DRAFT_DELAY_MS = 800;

const noop = () => () => {};
const same = (a: Cv, b: Cv) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Keeps what is being typed in this browser so a reload, a closed tab or a crash loses nothing.
 * - `dirty`: the form differs from what is saved on the server; a warning is raised if the tab is closed then.
 * - `offer`: a draft left by an earlier visit, to restore or discard. While it is open nothing is written, so the
 *   draft cannot be overwritten before the person chooses.
 * `touch` must be called on every edit; `markSaved` after the server accepted `sent`.
 */
export function useCvDraft({ userId, cv, initial }: { userId: string; cv: Cv; initial: Cv }) {
  const [baseline, setBaseline] = useState(initial);
  const [decided, setDecided] = useState(false);
  // Storage is read through the external-store hook: the server renders without it and hydration stays consistent.
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const raw = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => readRaw(userId),
    () => null,
  );
  const stored: CvDraft | null = useMemo(() => parseDraft(raw), [raw]);
  const offer = hydrated && !decided && stored && !same(stored.cv, baseline) ? stored : null;
  const dirty = !same(cv, baseline);

  useEffect(() => {
    if (!hydrated || offer) return;
    if (!dirty) {
      clearDraft(userId);
      return;
    }
    const timer = setTimeout(() => writeDraft(userId, cv), DRAFT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hydrated, offer, dirty, cv, userId]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return {
    dirty,
    offer,
    touch: () => {
      if (!offer) setDecided(true);
    },
    restore: (): Cv | null => {
      setDecided(true);
      return offer?.cv ?? null;
    },
    discard: () => {
      clearDraft(userId);
      setDecided(true);
    },
    markSaved: (sent: Cv) => {
      setBaseline(sent);
      clearDraft(userId);
    },
  };
}
