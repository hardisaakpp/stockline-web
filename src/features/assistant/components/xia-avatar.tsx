import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** The assistant's face in the conversation. */
export function XiaAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
        className,
      )}
    >
      <Sparkles className="size-4" />
    </span>
  );
}
