"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { SelectField, SwitchField } from "@/components/ui/form-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/features/auth";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { createUser, resetUserPassword, updateUser } from "../actions.server";
import {
  createUserSchema,
  isLastActiveAdmin,
  resetPasswordSchema,
  updateUserSchema,
  type CreateUserValues,
  type ResetPasswordValues,
  type UpdateUserValues,
} from "../forms";
import { FormError, RoleOptions, SubmitFooter, useFieldMessage, type Common } from "./dialog-parts";

export function CreateUserDialog({ open, onOpenChange }: Common) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const describe = useErrorMessage();
  const message = useFieldMessage();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", displayName: "", password: "", role: "Buyer", isAdmin: false },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(null);
      const result = await createUser(values);
      if (!result.ok)
        return setError(
          result.error.code === "conflict" ? t("errors.emailTaken") : describe(result.error),
        );
      toast.success(t("toasts.created"));
      form.reset();
      onOpenChange(false);
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("form.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormField
            id="email"
            label={t("form.email")}
            type="email"
            autoComplete="off"
            error={message(errors.email?.message)}
            {...form.register("email")}
          />
          <FormField
            id="displayName"
            label={t("form.displayName")}
            autoComplete="off"
            error={message(errors.displayName?.message)}
            {...form.register("displayName")}
          />
          <FormField
            id="password"
            label={t("form.password")}
            type="password"
            autoComplete="new-password"
            hint={t("form.passwordHint")}
            error={message(errors.password?.message)}
            {...form.register("password")}
          />
          <SelectField id="role" label={t("form.role")} {...form.register("role")}>
            <RoleOptions />
          </SelectField>
          <Controller
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <SwitchField
                id="isAdmin"
                label={t("form.isAdmin")}
                hint={t("form.isAdminHint")}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormError message={error} />
          <SubmitFooter
            pending={pending}
            label={tCommon("create")}
            pendingLabel={tCommon("creating")}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditProps = Common & { user: User; users: readonly User[] };

export function EditUserDialog({ user, users, open, onOpenChange }: EditProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const describe = useErrorMessage();
  const message = useFieldMessage();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      displayName: user.displayName,
      role: user.role,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    },
  });
  // The API refuses to leave the system without an active administrator; the form says so up front.
  const locked = isLastActiveAdmin(user, users);
  // A directory account's name, role and administrator access follow its groups there: only "active" is ours to change.
  const managed = user.provider === "Directory";

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(null);
      const result = await updateUser(
        user.id,
        managed
          ? {
              displayName: user.displayName,
              role: user.role,
              isAdmin: user.isAdmin,
              isActive: values.isActive,
            }
          : values,
      );
      if (!result.ok) return setError(describe(result.error));
      toast.success(t("toasts.updated"));
      onOpenChange(false);
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("form.editTitle")}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        {managed && (
          <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {t("form.directoryManaged")}
          </p>
        )}
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormField
            id="displayName"
            label={t("form.displayName")}
            disabled={managed}
            error={message(form.formState.errors.displayName?.message)}
            {...form.register("displayName")}
          />
          <SelectField
            id="role"
            label={t("form.role")}
            disabled={managed}
            {...form.register("role")}
          >
            <RoleOptions />
          </SelectField>
          <Controller
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <SwitchField
                id="isAdmin"
                label={t("form.isAdmin")}
                hint={locked ? t("form.lastAdminHint") : t("form.isAdminHint")}
                checked={field.value}
                disabled={locked || managed}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <SwitchField
                id="isActive"
                label={t("form.isActive")}
                hint={locked ? t("form.lastAdminHint") : t("form.isActiveHint")}
                checked={field.value}
                disabled={locked}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormError message={error} />
          <SubmitFooter
            pending={pending}
            label={tCommon("save")}
            pendingLabel={tCommon("saving")}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ user, open, onOpenChange }: Common & { user: User }) {
  const t = useTranslations("admin.users");
  const describe = useErrorMessage();
  const message = useFieldMessage();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      setError(null);
      const result = await resetUserPassword(user.id, values);
      if (!result.ok) return setError(describe(result.error));
      toast.success(t("reset.done"));
      form.reset();
      onOpenChange(false);
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reset.title")}</DialogTitle>
          <DialogDescription>
            {t("reset.description", { name: user.displayName })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormField
            id="newPassword"
            label={t("reset.newPassword")}
            type="password"
            autoComplete="new-password"
            hint={t("form.passwordHint")}
            error={message(form.formState.errors.newPassword?.message)}
            {...form.register("newPassword")}
          />
          <FormError message={error} />
          <SubmitFooter
            pending={pending}
            label={t("reset.submit")}
            pendingLabel={t("reset.submit")}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
