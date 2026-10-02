export type Wait = { unit: "minutes" | "hours"; count: number };

/** A waiting time a person can read: whole minutes under an hour, whole hours above (always rounded up). */
export function describeWait(seconds: number): Wait {
  const safe = Math.max(0, seconds);
  if (safe < 3600) return { unit: "minutes", count: Math.max(1, Math.ceil(safe / 60)) };
  return { unit: "hours", count: Math.ceil(safe / 3600) };
}
