import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/i18n/formatters";
import { cn } from "@/lib/utils";
import type { ErpDocument, ErpSubmission } from "../schemas";

const DOC_STATUS_TONE: Record<string, string> = {
  Sent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Failed: "bg-destructive/10 text-destructive",
  Pending: "bg-muted text-muted-foreground",
};

const KNOWN_KINDS = ["PurchaseOrder", "TransferRequest"] as const;
const KNOWN_STATUSES = ["Pending", "Sent", "Failed"] as const;
const isIn = <T extends readonly string[]>(list: T, value: string): value is T[number] =>
  (list as readonly string[]).includes(value);

/** Purchase orders and transfer requests the ERP was asked to create for this order. */
export function ErpPanel({
  orderId,
  submission,
  canPrint,
}: {
  orderId: string;
  submission: ErpSubmission;
  canPrint: boolean;
}) {
  const t = useTranslations("orders.erp");
  const f = useFormatters();
  const documents = submission.documents;

  if (documents.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("noDocuments")}</p>;

  const route = (doc: ErpDocument) =>
    doc.destinationLocation
      ? `${doc.originWarehouse ?? "—"} → ${doc.destinationLocation}`
      : (doc.originWarehouse ?? "—");

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("columns.kind")}</TableHead>
              <TableHead>{t("columns.route")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="text-right">{t("columns.attempts")}</TableHead>
              <TableHead>{t("columns.number")}</TableHead>
              <TableHead>{t("columns.sent")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                orderId={orderId}
                route={route(doc)}
                canPrint={canPrint}
                sent={f.dateTime(doc.sentAt)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DocumentRow({
  doc,
  orderId,
  route,
  canPrint,
  sent,
}: {
  doc: ErpDocument;
  orderId: string;
  route: string;
  canPrint: boolean;
  sent: string;
}) {
  const t = useTranslations("orders.erp");

  return (
    <>
      <TableRow className={doc.lastError ? "border-b-0" : undefined}>
        <TableCell className="font-medium">
          {isIn(KNOWN_KINDS, doc.kind) ? t(`kind.${doc.kind}`) : doc.kind}
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">{route}</TableCell>
        <TableCell>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              DOC_STATUS_TONE[doc.status] ?? DOC_STATUS_TONE.Pending,
            )}
          >
            {isIn(KNOWN_STATUSES, doc.status) ? t(`docStatus.${doc.status}`) : doc.status}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums">{doc.attempts}</TableCell>
        <TableCell className="tabular-nums">{doc.docNum ?? "—"}</TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">{sent}</TableCell>
        <TableCell>
          {canPrint && doc.kind === "PurchaseOrder" && (
            <a
              href={`/api/bff/orders/${orderId}/erp-documents/${doc.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <FileText className="size-3.5" />
              {t("pdf")}
            </a>
          )}
        </TableCell>
      </TableRow>
      {doc.lastError && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="pt-0 pb-3 text-xs whitespace-normal text-destructive">
            <span className="font-medium">{t("lastError")}:</span> {doc.lastError}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
