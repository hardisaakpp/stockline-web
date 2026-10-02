import type { ChatTurn } from "./schemas";

/** Xia accepts at most this many previous turns and ignores anything older. */
export const MAX_HISTORY_TURNS = 10;
const MAX_TURN_CHARS = 4000;

export type XiaTurn = { rol: "user" | "bot"; texto: string };

/** The recent conversation in Xia's wording, so follow-up questions ("and if it fails?") make sense. */
export function toXiaHistory(history: readonly ChatTurn[]): XiaTurn[] {
  return history
    .filter((turn) => turn.text.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      rol: turn.role === "user" ? "user" : "bot",
      texto: turn.text.slice(0, MAX_TURN_CHARS),
    }));
}
