"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { careersApi } from "./api";
import { inputs } from "./action-input";

const toBase64 = (bytes: ArrayBuffer) => Buffer.from(bytes).toString("base64");

export async function saveCv(values: unknown) {
  return runAction(inputs.saveCv, [values], async ([cv]) => {
    await careersApi.saveCv(cv);
    revalidatePath("/careers", "layout");
  });
}

/** The PDF of what is on screen right now, as base64: nothing is saved. */
export async function previewCv(values: unknown) {
  return runAction(inputs.previewCv, [values], async ([cv]) =>
    toBase64(await careersApi.cvPdf(cv)),
  );
}

/** The PDF of the CV as it is saved (what the viewer page shows), as base64. */
export async function savedCvPdf() {
  return runAction(inputs.none, [], async () => toBase64(await careersApi.cvPdf()));
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
