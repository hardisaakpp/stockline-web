"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { careersApi } from "./api";
import { inputs } from "./action-input";

const toBase64 = (bytes: ArrayBuffer) => Buffer.from(bytes).toString("base64");

export async function saveCv(values: unknown, lang: unknown = "es") {
  return runAction(inputs.saveCv, [values, lang], async ([cv, language]) => {
    await careersApi.saveCv(cv, language);
    revalidatePath("/careers", "layout");
  });
}

/** The PDF of what is on screen right now, as base64: nothing is saved. */
export async function previewCv(values: unknown, lang: unknown = "es") {
  return runAction(inputs.previewCv, [values, lang], async ([cv, language]) =>
    toBase64(await careersApi.cvPdf(cv, language)),
  );
}

/** The PDF of the CV as it is saved in that language (what the viewer page shows), as base64. */
export async function savedCvPdf(lang: unknown = "es") {
  return runAction(inputs.language, [lang], async ([language]) =>
    toBase64(await careersApi.cvPdf(undefined, language)),
  );
}

/** An English draft of the saved Spanish CV. Nothing is saved: the person edits it first. */
export async function translateCv() {
  return runAction(inputs.none, [], async () => careersApi.translateCv());
}

/** Reads an uploaded CV (PDF, DOCX or a LinkedIn ZIP) into a draft. Nothing is saved: the person reviews it first. */
export async function importCv(formData: FormData) {
  return runAction(inputs.importFile, [formData.get("file")], async ([file]) =>
    careersApi.importCv(await file.arrayBuffer()),
  );
}

export async function savePreferences(values: unknown) {
  return runAction(inputs.savePreferences, [values], async ([preferences]) => {
    await careersApi.savePreferences(preferences);
    revalidatePath("/careers/offers");
  });
}

export async function refreshOffers(force: unknown) {
  return runAction(inputs.refreshOffers, [force], async ([forced]) => {
    const result = await careersApi.refreshOffers(forced);
    revalidatePath("/careers/offers");
    return result;
  });
}

export async function prepareApplication(offerId: unknown) {
  return runAction(inputs.prepare, [offerId], async ([id]) => {
    const created = await careersApi.prepareApplication(id);
    revalidatePath("/careers", "layout");
    return created;
  });
}

export async function editLetter(id: unknown, letter: unknown) {
  return runAction(inputs.editLetter, [id, letter], async ([applicationId, text]) => {
    await careersApi.editLetter(applicationId, text);
    revalidatePath(`/careers/applications/${applicationId}`);
  });
}

export async function actOnApplication(id: unknown, action: unknown) {
  return runAction(inputs.act, [id, action], async ([applicationId, what]) => {
    const result = await careersApi.act(applicationId, what);
    revalidatePath("/careers", "layout");
    return result;
  });
}

export async function applicationPdf(id: unknown) {
  return runAction(inputs.idOnly, [id], async ([applicationId]) =>
    toBase64(await careersApi.applicationPdf(applicationId)),
  );
}
