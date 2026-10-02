"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { adminApi } from "./api";
import { inputs } from "./action-input";

export async function createUser(values: unknown) {
  return runAction(inputs.createUser, [values], async ([body]) => {
    const user = await adminApi.createUser(body);
    revalidatePath("/admin/users");
    return user;
  });
}

export async function updateUser(userId: string, values: unknown) {
  return runAction(inputs.updateUser, [userId, values], async ([id, body]) => {
    const user = await adminApi.updateUser(id, body);
    revalidatePath("/admin/users");
    return user;
  });
}

export async function resetUserPassword(userId: string, values: unknown) {
  return runAction(inputs.resetPassword, [userId, values], ([id, body]) =>
    adminApi.resetPassword(id, body.newPassword),
  );
}

export async function createLocation(values: unknown) {
  return runAction(inputs.createLocation, [values], async ([body]) => {
    const location = await adminApi.createLocation({
      ...body,
      supplyingWarehouseCode: body.kind === "Store" ? body.supplyingWarehouseCode : null,
    });
    revalidatePath("/admin/locations");
    return location;
  });
}

export async function updateLocation(locationCode: string, values: unknown) {
  return runAction(inputs.updateLocation, [locationCode, values], async ([code, body]) => {
    const location = await adminApi.updateLocation(code, body);
    revalidatePath("/admin/locations");
    return location;
  });
}

export async function subscribeEmail(values: unknown) {
  return runAction(inputs.subscribe, [values], async ([body]) => {
    const subscription = await adminApi.subscribe(body);
    revalidatePath("/admin/notifications");
    return subscription;
  });
}

export async function unsubscribeEmail(subscriptionId: string) {
  return runAction(inputs.idOnly, [subscriptionId], async ([id]) => {
    await adminApi.unsubscribe(id);
    revalidatePath("/admin/notifications");
  });
}

export async function previewEmail(topic: string) {
  return runAction(inputs.topic, [topic], ([name]) => adminApi.preview(name));
}
