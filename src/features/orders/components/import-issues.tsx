import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ImportIssue, ImportValidation } from "../schemas";

/** Errors first, then warnings, keeping the file order inside each group. */
export function sortIssues(issues: readonly ImportIssue[]): ImportIssue[] {
  const rank = { Error: 0, Warning: 1 } as const;
  return issues
    .map((issue, index) => ({ issue, index }))
    .sort((a, b) => rank[a.issue.severity] - rank[b.issue.severity] || a.index - b.index)
    .map(({ issue }) => issue);
}

const SUMMARY = {
  error: {
    icon: AlertCircle,
    title: "invalid",
    box: "border-destructive/30 bg-destructive/5",
    color: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    title: "validWithWarnings",
    box: "border-amber-500/30 bg-amber-500/5",
    color: "text-amber-600",
  },
  ok: {
    icon: CheckCircle2,
    title: "valid",
    box: "border-emerald-500/30 bg-emerald-500/5",
    color: "text-emerald-600",
  },
} as const;

export function ValidationSummary({
  result,
}: {
  result: Pick<ImportValidation, "errors" | "warnings">;
}) {
  const t = useTranslations("orders.import");
  const {
    icon: Icon,
    title,
    box,
    color,
  } = SUMMARY[result.errors > 0 ? "error" : result.warnings > 0 ? "warning" : "ok"];

  return (
    <div role="status" className={cn("flex items-center gap-3 rounded-xl border p-4", box)}>
      <Icon className={cn("size-5 shrink-0", color)} />
      <div>
        <p className="font-medium">{t(title)}</p>
        <p className="text-sm text-muted-foreground">
          {t("counts", { errors: result.errors, warnings: result.warnings })}
        </p>
      </div>
    </div>
  );
}

export function ImportIssuesTable({ issues }: { issues: readonly ImportIssue[] }) {
  const t = useTranslations("orders.import");
  if (issues.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-28">{t("issueColumns.severity")}</TableHead>
            <TableHead className="w-40">{t("issueColumns.where")}</TableHead>
            <TableHead>{t("issueColumns.message")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortIssues(issues).map((issue, index) => (
            <TableRow key={`${issue.code}-${issue.row}-${issue.field}-${index}`}>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    issue.severity === "Error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                  )}
                >
                  {t(`severity.${issue.severity}`)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[issue.row ? t("row", { row: issue.row }) : null, issue.field]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </TableCell>
              <TableCell className="whitespace-normal">
                {issue.message}
                {issue.suggestions && issue.suggestions.length > 0 && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t("suggestions", { values: issue.suggestions.join(", ") })}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
