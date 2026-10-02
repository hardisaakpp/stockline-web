import { describe, expect, it } from "vitest";
import { getFormatters } from "./format";

const en = getFormatters("en");
const es = getFormatters("es");

describe("format", () => {
  it("renders calendar dates in the interface language without shifting the day", () => {
    expect(en.date("2026-10-01")).toBe("Oct 01, 2026");
    expect(en.date("2026-01-01")).toBe("Jan 01, 2026");
    expect(en.shortDate("2026-12-31")).toBe("Dec 31");
    expect(es.date("2026-10-01")).toMatch(/^01 oct\.? 2026$/);
    expect(es.date("2026-01-01")).toMatch(/^01 ene\.? 2026$/);
  });

  it("renders missing values as an em dash", () => {
    for (const f of [en, es]) {
      expect(f.date(null)).toBe("—");
      expect(f.date(undefined)).toBe("—");
      expect(f.dateTime(null)).toBe("—");
      expect(f.quantity(null)).toBe("—");
      expect(f.currency(undefined)).toBe("—");
      expect(f.percent(null)).toBe("—");
    }
  });

  it("formats numbers identically in both languages (comma thousands, dot decimals, USD)", () => {
    for (const f of [en, es]) {
      expect(f.quantity(1234.5)).toBe("1,234.5");
      expect(f.quantity(1234.5678)).toBe("1,234.57");
      expect(f.quantity(0)).toBe("0");
      expect(f.currency(1234.5)).toBe("$1,234.50");
      expect(f.percent(0.255)).toBe("25.5%");
    }
  });

  it("formats an instant as date and time", () => {
    expect(en.dateTime("2026-10-01T19:30:00Z")).toMatch(/^Oct 01, 2026, \d{2}:\d{2} (AM|PM)$/);
  });

  it("caches formatters per locale", () => {
    expect(getFormatters("en")).toBe(en);
    expect(getFormatters("es")).not.toBe(en);
  });
});
