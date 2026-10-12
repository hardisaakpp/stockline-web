import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, draftKey, parseDraft, readRaw, writeDraft } from "./cv-draft";
import type { Cv } from "./schemas";

const cv: Cv = {
  fullName: "Ana",
  headline: "",
  summary: "",
  contact: { email: "", links: {}, phone: null, location: null },
  experience: [],
  research: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  references: [],
  hidden: [],
};

beforeEach(() => window.localStorage.clear());

describe("cv draft storage", () => {
  it("writes, reads back and clears", () => {
    writeDraft("u1", cv, 1000);
    expect(parseDraft(readRaw("u1"))).toEqual({ cv, savedAt: 1000 });
    clearDraft("u1");
    expect(readRaw("u1")).toBeNull();
  });

  it("keeps one draft per person", () => {
    writeDraft("u1", cv, 1);
    expect(readRaw("u2")).toBeNull();
    expect(draftKey("u1")).not.toBe(draftKey("u2"));
  });

  it("ignores anything that is not a valid draft", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("not json")).toBeNull();
    expect(parseDraft("[]")).toBeNull();
    expect(parseDraft(JSON.stringify({ cv: { fullName: 1 }, savedAt: 1 }))).toBeNull();
    expect(parseDraft(JSON.stringify({ cv, savedAt: "yesterday" }))).toBeNull();
  });
});
