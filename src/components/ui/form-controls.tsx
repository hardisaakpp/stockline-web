import type { ComponentProps, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";

type SelectFieldProps = Omit<ComponentProps<"select">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

/** Label + native select (+ optional hint), wired together with aria attributes. */
export function SelectField({ id, label, hint, children, ...props }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-10"
        {...props}
      >
        {children}
      </NativeSelect>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

type SwitchFieldProps = {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** A switch with its label and an explanation beside it. */
export function SwitchField({
  id,
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: SwitchFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
