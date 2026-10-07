import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/actions/result";
import messages from "@/messages/en";
import type { Preferences } from "../schemas";
import { PreferencesPanel, parseYears } from "./preferences-panel";

const savePreferences = vi.fn<(values: Preferences) => Promise<ActionResult<void>>>();
vi.mock("../actions.server", () => ({ savePreferences: (v: Preferences) => savePreferences(v) }));

const none: Preferences = {
  excludeTitles: [],
  excludeText: [],
  locations: [],
  requiredTechnologies: [],
  maxYears: null,
};

const renderPanel = (initial: Preferences = none) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PreferencesPanel initial={initial} />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  savePreferences.mockReset();
  savePreferences.mockResolvedValue({ ok: true, data: undefined });
});

describe("parseYears", () => {
  it("empty means no limit", () => {
    expect(parseYears("")).toBeNull();
    expect(parseYears("   ")).toBeNull();
  });

  it("keeps a whole number inside what the API accepts", () => {
    expect(parseYears("3")).toBe(3);
    expect(parseYears("0")).toBe(0); // zero is a real limit, not «no limit»
    expect(parseYears("2.9")).toBe(2);
    expect(parseYears("-4")).toBe(0);
    expect(parseYears("99")).toBe(30);
  });

  it("anything that is not a number is no limit", () => {
    expect(parseYears("abc")).toBeNull();
  });
});

describe("PreferencesPanel experience limit", () => {
  it("shows no limit when there is none", () => {
    renderPanel();
    expect(screen.getByLabelText("Most experience they ask for (years)")).toHaveValue(null);
  });

  it("shows the saved limit", () => {
    renderPanel({ ...none, maxYears: 3 });
    expect(screen.getByLabelText("Most experience they ask for (years)")).toHaveValue(3);
  });

  it("sends the limit with the rest of the rules when saving", async () => {
    renderPanel({ ...none, excludeTitles: ["sales"] });

    await userEvent.type(screen.getByLabelText("Most experience they ask for (years)"), "3");
    await userEvent.click(screen.getByRole("button", { name: /save rules/i }));

    await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(1));
    expect(savePreferences).toHaveBeenCalledWith({
      ...none,
      excludeTitles: ["sales"],
      maxYears: 3,
    });
  });

  it("clearing the field removes the limit instead of saving zero", async () => {
    renderPanel({ ...none, maxYears: 3 });

    await userEvent.clear(screen.getByLabelText("Most experience they ask for (years)"));
    await userEvent.click(screen.getByRole("button", { name: /save rules/i }));

    await waitFor(() => expect(savePreferences).toHaveBeenCalled());
    expect(savePreferences.mock.calls[0]![0].maxYears).toBeNull();
  });

  it("explains what the number does", () => {
    renderPanel();
    expect(
      screen.getByText(/senior roles and those asking for more than 3 years are hidden/i),
    ).toBeInTheDocument();
  });
});
