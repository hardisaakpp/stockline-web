"use client";

import { KeyRound, MoreHorizontal, Network, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageHeader } from "@/components/feedback/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/features/auth";
import { useFormatters } from "@/i18n/formatters";
import { cn } from "@/lib/utils";
import { CreateUserDialog, EditUserDialog, ResetPasswordDialog } from "./user-dialogs";

type Dialog = { type: "edit" | "reset"; user: User } | { type: "create" } | null;

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const t = useTranslations("admin.users");
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-4" />
            {t("new")}
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.role")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("columns.created")}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t("actions.edit")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                onEdit={() => setDialog({ type: "edit", user })}
                onReset={() => setDialog({ type: "reset", user })}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {dialog?.type === "create" && <CreateUserDialog open onOpenChange={close} />}
      {dialog?.type === "edit" && (
        <EditUserDialog
          key={dialog.user.id}
          user={dialog.user}
          users={users}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.type === "reset" && (
        <ResetPasswordDialog key={dialog.user.id} user={dialog.user} open onOpenChange={close} />
      )}
    </div>
  );
}

type RowProps = { user: User; isSelf: boolean; onEdit: () => void; onReset: () => void };

function UserRow({ user, isSelf, onEdit, onReset }: RowProps) {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("admin.roles.roles");
  const tCommon = useTranslations("admin.common");
  const f = useFormatters();

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {user.displayName}
          {isSelf && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t("you")}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {user.email}
          {user.provider === "Directory" && (
            <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[0.7rem] font-medium">
              <Network className="size-3" aria-hidden="true" />
              {t("directoryBadge")}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          {tRoles(user.role)}
          {user.isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="size-3" />
              {t("adminBadge")}
            </span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            !user.isActive && "text-muted-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              user.isActive ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
          {user.isActive ? tCommon("active") : tCommon("inactive")}
        </span>
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {f.date(user.createdAt.slice(0, 10))}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("actions.menu", { name: user.displayName })}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              {t("actions.edit")}
            </DropdownMenuItem>
            {user.provider === "Local" && (
              <DropdownMenuItem onClick={onReset}>
                <KeyRound className="size-4" />
                {t("actions.resetPassword")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
