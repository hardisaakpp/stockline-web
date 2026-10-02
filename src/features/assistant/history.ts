import type { ChatTurn } from "./schemas";

/** Xia accepts at most this many previous turns and ignores anything older. */
export const MAX_HISTORY_TURNS = 10;
const MAX_TURN_CHARS = 4000;

export type XiaMessage = { rol: "user" | "assistant"; texto: string };

/** The recent conversation in Xia's wording, so follow-up questions ("and the second one?") make sense. */
export function toXiaMessages(history: readonly ChatTurn[]): XiaMessage[] {
  return history
    .filter((turn) => turn.text.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      rol: turn.role,
      texto: turn.text.slice(0, MAX_TURN_CHARS),
    }));
}
