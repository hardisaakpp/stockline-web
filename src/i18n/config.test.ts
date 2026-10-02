import { describe, expect, it } from "vitest";
import { isLocale, matchAcceptLanguage } from "./config";
import en from "../messages/en";
import es from "../messages/es";

function keys(object: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

/** ICU placeholders like {name} or {count, plural, ...}: both languages must use the same ones. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]!).sort();
}

function flatten(object: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === "object" && value !== null
        ? Object.entries(flatten(value as Record<string, unknown>, `${prefix}${key}.`))
        : [[`${prefix}${key}`, String(value)]],
    ),
  );
}

describe("message catalogs", () => {
  it("have exactly the same keys in every language", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });

  it("use the same placeholders in every language", () => {
    const english = flatten(en);
    const spanish = flatten(es);
    for (const key of Object.keys(english)) {
      expect(placeholders(spanish[key]!), key).toEqual(placeholders(english[key]!));
    }
  });

  it("have no empty translations", () => {
    for (const catalog of [flatten(en), flatten(es)]) {
      for (const [key, value] of Object.entries(catalog)) expect(value.trim(), key).not.toBe("");
    }
  });
});

describe("locale detection", () => {
  it("recognizes supported locales only", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it.each([
    ["es-EC,es;q=0.9,en;q=0.8", "es"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,fr;q=0.9,es;q=0.8", "es"],
    ["en;q=0.5,es;q=0.9", "es"],
    ["fr-FR", null],
    ["es;q=0", null],
    ["", null],
    [null, null],
  ])("%j → %s", (header, expected) => {
    expect(matchAcceptLanguage(header)).toBe(expected);
  });
});
