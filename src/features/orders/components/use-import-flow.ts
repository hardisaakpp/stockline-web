"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ImportValidation } from "../schemas";
import type { FileProblem } from "./file-dropzone";
import {
  importTemplate,
  toImportFailure,
  validateTemplate,
  type ImportFailure,
} from "./import-client";

export type ImportPhase =
  | { name: "choose" }
  | { name: "validating" }
  | { name: "checked"; result: ImportValidation }
  | { name: "importing"; result: ImportValidation }
  | { name: "imported"; orderId: string };

/** State machine of the import wizard: choose → check (dry run) → import. Nothing is created until the import step. */
export function useImportFlow() {
  const t = useTranslations("orders.import");
  const [file, setFile] = useState<File | null>(null);
  const [checkErp, setCheckErp] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>({ name: "choose" });
  const [failure, setFailure] = useState<ImportFailure | null>(null);
  const [problem, setProblem] = useState<FileProblem | null>(null);

  const select = (next: File | null) => {
    setFile(next);
    setProblem(null);
    setFailure(null);
    setPhase({ name: "choose" });
  };

  const check = async () => {
    if (!file) return;
    setFailure(null);
    setPhase({ name: "validating" });
    try {
      setPhase({ name: "checked", result: await validateTemplate(file, checkErp) });
    } catch (error) {
      setFailure(toImportFailure(error));
      setPhase({ name: "choose" });
    }
  };

  const runImport = async () => {
    if (!file || phase.name !== "checked") return;
    const { result } = phase;
    setFailure(null);
    setPhase({ name: "importing", result });
    try {
      const imported = await importTemplate(file, checkErp);
      toast.success(t("imported"));
      setPhase({ name: "imported", orderId: imported.orderId });
    } catch (error) {
      setFailure(toImportFailure(error));
      setPhase({ name: "checked", result });
    }
  };

  const checked = phase.name === "checked" || phase.name === "importing" ? phase.result : null;

  return {
    file,
    checkErp,
    setCheckErp,
    phase,
    failure,
    problem,
    setProblem,
    select,
    check,
    runImport,
    checked,
    busy: phase.name === "validating" || phase.name === "importing",
    /** Findings to show: those the API attached to a failed call, otherwise those of the last check. */
    findings: failure?.issues.length ? failure.issues : (checked?.issues ?? []),
  };
}
