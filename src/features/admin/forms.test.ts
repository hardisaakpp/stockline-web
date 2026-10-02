import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  isLastActiveAdmin,
  locationDefaults,
  locationFormSchema,
  resetPasswordSchema,
  subscribeSchema,
  updateUserSchema,
} from "./forms";

const valid = {
  email: "ana@stockline.test",
  displayName: "Ana",
  password: "long-enough-1",
  role: "Buyer",
  isAdmin: false,
} as const;

describe("createUserSchema", () => {
  it("accepts a complete user and trims text", () => {
    const result = createUserSchema.safeParse({
      ...valid,
      email: " ana@stockline.test ",
      displayName: "  Ana ",
    });

    expect(result.success && [result.data.email, result.data.displayName]).toEqual([
      "ana@stockline.test",
      "Ana",
    ]);
  });

  it("reports catalog keys for each invalid field", () => {
    const result = createUserSchema.safeParse({
      ...valid,
      email: "nope",
      displayName: " ",
      password: "short",
    });

    expect(!result.success && result.error.flatten().fieldErrors).toMatchObject({
      email: ["emailInvalid"],
      displayName: ["nameRequired"],
      password: ["passwordShort"],
    });
  });

  it("only allows assignable roles", () => {
    expect(createUserSchema.safeParse({ ...valid, role: "System" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, role: "SupplierProduction" }).success).toBe(true);
  });
});

describe("other forms", () => {
  it("update requires a name", () => {
    expect(
      updateUserSchema.safeParse({ displayName: "", role: "Buyer", isAdmin: false, isActive: true })
        .success,
    ).toBe(false);
  });

  it("password reset enforces the same minimum length as the API", () => {
    expect(resetPasswordSchema.safeParse({ newPassword: "123456789" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ newPassword: "1234567890" }).success).toBe(true);
  });

  it("locations need a code, a name and a known kind", () => {
    const base = {
      code: "ST-9",
      name: "Harbor",
      kind: "Store",
      supplyingWarehouseCode: "WH-MAIN",
      isActive: true,
    };
    expect(locationFormSchema.safeParse(base).success).toBe(true);
    expect(locationFormSchema.safeParse({ ...base, kind: "Truck" }).success).toBe(false);
    expect(locationFormSchema.safeParse({ ...base, code: " " }).success).toBe(false);
  });

  it("subscriptions need a valid email", () => {
    expect(subscribeSchema.safeParse({ email: "a@b.co", topic: "OrderSubmitted" }).success).toBe(
      true,
    );
    expect(subscribeSchema.safeParse({ email: "a", topic: "OrderSubmitted" }).success).toBe(false);
  });
});

describe("isLastActiveAdmin", () => {
  const admin = { id: "1", isAdmin: true, isActive: true };

  it("is true only for the single active administrator", () => {
    expect(isLastActiveAdmin(admin, [admin, { id: "2", isAdmin: false, isActive: true }])).toBe(
      true,
    );
    expect(isLastActiveAdmin(admin, [admin, { id: "2", isAdmin: true, isActive: true }])).toBe(
      false,
    );
    expect(isLastActiveAdmin(admin, [admin, { id: "2", isAdmin: true, isActive: false }])).toBe(
      true,
    );
  });

  it("is false for people who are not active administrators", () => {
    const user = { id: "3", isAdmin: false, isActive: true };
    expect(isLastActiveAdmin(user, [admin, user])).toBe(false);
    expect(isLastActiveAdmin({ ...admin, isActive: false }, [{ ...admin, isActive: false }])).toBe(
      false,
    );
  });
});

describe("locationDefaults", () => {
  it("starts a new location as an active store of the first warehouse", () => {
    expect(locationDefaults(null, [{ code: "WH-A" }, { code: "WH-B" }])).toEqual({
      code: "",
      name: "",
      kind: "Store",
      supplyingWarehouseCode: "WH-A",
      isActive: true,
    });
    expect(locationDefaults(null, [])).toMatchObject({ supplyingWarehouseCode: null });
  });

  it("uses the location being edited", () => {
    const location = {
      code: "ST-1",
      name: "Downtown",
      kind: "Store",
      supplyingWarehouseCode: "WH-B",
      isActive: false,
    } as const;
    expect(locationDefaults(location, [{ code: "WH-A" }])).toEqual(location);
  });
});
