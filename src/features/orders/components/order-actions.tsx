"use client";

import { Download, FileDown, Loader2, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyOrderAction, discardOrder, requestErpSubmission } from "../actions.server";
import { visibleActions, type ActionMeta, type ConfirmAction, type UserAction } from "../actions";
import { canSeeStatus, type OrderCapabilities } from "../capabilities";
import type { Role } from "@/features/auth";
import type { OrderAction, OrderDifference, OrderStatus } from "../schemas";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { ConfirmBySupplierDialog } from "./confirm-by-supplier-dialog";
import { ButtonLink } from "@/components/ui/button-link";

type Props = {
  orderId: string;
  role: Role;
  status: OrderStatus;
  actions: readonly OrderAction[];
  caps: OrderCapabilities;
  /** Loaded only when the user can confirm the order as supplier. */
  difference: OrderDifference | null;
};

type Pending =
  { type: "action"; action: ConfirmAction } | { type: "erp" } | { type: "discard" } | null;

export function OrderActions({ orderId, role, status, actions, caps, difference }: Props) {
  const t = useTranslations("orders");
  const describe = useErrorMessage();
  const router = useRouter();
  const [confirming, setConfirming] = useState<Pending>(null);
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [busy, startTransition] = useTransition();

  const shown = visibleActions(actions);
  const forward = shown.filter((a) => a.meta.tone !== "destructive");
  const destructive = shown.filter((a) => a.meta.tone === "destructive");

  const finish = (
    result: { ok: true } | { ok: false; error: Parameters<typeof describe>[0] },
    success: string,
    after?: () => void,
  ) => {
    if (result.ok) {
      toast.success(success);
      after?.();
    } else {
      toast.error(describe(result.error));
    }
    setConfirming(null);
  };

  const run = (action: UserAction) =>
    startTransition(async () => {
      const result = await applyOrderAction(orderId, action);
      // The order may have moved to a status this role is not allowed to open (e.g. production
      // after confirming): leave the page instead of showing a 404.
      const leave = result.ok && !canSeeStatus(role, result.data.status);
      finish(
        result,
        t("actions.done", { action: t(`actions.label.${action}`) }),
        leave ? () => router.push("/orders") : undefined,
      );
    });
  const sendToErp = () =>
    startTransition(async () => finish(await requestErpSubmission(orderId), t("erp.requested")));
  const discard = () =>
    startTransition(async () =>
      finish(await discardOrder(orderId), t("detail.discarded"), () => router.push("/orders")),
    );

  const trigger = (action: UserAction, meta: ActionMeta) => {
    if (meta.kind === "confirmBySupplier") return setSupplierDialog(true);
    if (meta.confirm) return setConfirming({ type: "action", action: action as ConfirmAction });
    run(action);
  };

  const dialog = confirming && dialogCopy(confirming, t);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forward.map(({ action, meta }) =>
        meta.kind === "redistribute" ? (
          <ButtonLink key={action} href={`/orders/${orderId}?tab=redistribution`}>
            {t(`actions.label.${action}`)}
          </ButtonLink>
        ) : (
          <Button key={action} onClick={() => trigger(action, meta)} disabled={busy}>
            {busy && confirming === null && <Loader2 className="size-4 animate-spin" />}
            {t(`actions.label.${action}`)}
          </Button>
        ),
      )}
      {caps.submitToErp && (
        <Button
          variant={status === "ErpSubmissionFailed" ? "default" : "outline"}
          onClick={() => setConfirming({ type: "erp" })}
          disabled={busy}
        >
          <Send className="size-4" />
          {status === "ErpSubmissionFailed" ? t("erp.retry") : t("erp.send")}
        </Button>
      )}

      <MoreMenu
        orderId={orderId}
        caps={caps}
        destructive={destructive}
        onTrigger={trigger}
        onDiscard={() => setConfirming({ type: "discard" })}
      />

      {dialog && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirming(null)}
          title={dialog.title}
          description={dialog.body}
          confirmLabel={dialog.confirmLabel}
          destructive={dialog.destructive}
          pending={busy}
          onConfirm={() => {
            if (confirming?.type === "action") run(confirming.action);
            else if (confirming?.type === "erp") sendToErp();
            else discard();
          }}
        />
      )}
      {difference && (
        <ConfirmBySupplierDialog
          orderId={orderId}
          difference={difference}
          open={supplierDialog}
          onOpenChange={setSupplierDialog}
        />
      )}
    </div>
  );
}

function dialogCopy(
  pending: NonNullable<Pending>,
  t: ReturnType<typeof useTranslations<"orders">>,
) {
  if (pending.type === "erp") {
    return {
      title: t("erp.sendTitle"),
      body: t("erp.sendBody"),
      confirmLabel: t("actions.confirmButton"),
      destructive: false,
    };
  }
  if (pending.type === "discard") {
    return {
      title: t("detail.discardTitle"),
      body: t("detail.discardBody"),
      confirmLabel: t("detail.discard"),
      destructive: true,
    };
  }
  return {
    title: t(`actions.confirm.${pending.action}.title`),
    body: t(`actions.confirm.${pending.action}.body`),
    confirmLabel: t("actions.confirmButton"),
    destructive: ["Cancel", "Reject", "CancelBySupplier"].includes(pending.action),
  };
}

type MoreMenuProps = {
  orderId: string;
  caps: OrderCapabilities;
  destructive: { action: UserAction; meta: ActionMeta }[];
  onTrigger: (action: UserAction, meta: ActionMeta) => void;
  onDiscard: () => void;
};

/** Downloads and the actions that close the order, kept out of the way of the main buttons. */
function MoreMenu({ orderId, caps, destructive, onTrigger, onDiscard }: MoreMenuProps) {
  const t = useTranslations("orders");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label={t("detail.more")} />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          render={<a href={`/api/bff/orders/${orderId}/export`} download />}
          nativeButton={false}
        >
          <FileDown className="size-4" />
          {t("detail.export")}
        </DropdownMenuItem>
        {caps.downloadSourceFile && (
          <DropdownMenuItem
            render={<a href={`/api/bff/orders/${orderId}/source-file`} download />}
            nativeButton={false}
          >
            <Download className="size-4" />
            {t("detail.sourceFile")}
          </DropdownMenuItem>
        )}
        {(destructive.length > 0 || caps.discard) && <DropdownMenuSeparator />}
        {destructive.map(({ action, meta }) => (
          <DropdownMenuItem
            key={action}
            variant="destructive"
            onClick={() => onTrigger(action, meta)}
          >
            {t(`actions.label.${action}`)}
          </DropdownMenuItem>
        ))}
        {caps.discard && (
          <DropdownMenuItem variant="destructive" onClick={() => onDiscard()}>
            <Trash2 className="size-4" />
            {t("detail.discard")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
