import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/actions/result";
import messages from "@/messages/en";
import type { Preferences } from "../schemas";
import { activeCount, PreferencesPanel } from "./preferences-panel";

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
const apply = () => screen.getByRole("button", { name: "Apply filters" });

beforeEach(() => {
  savePreferences.mockReset();
  savePreferences.mockResolvedValue({ ok: true, data: undefined });
});

describe("activeCount", () => {
  it("counts each filter that is doing something", () => {
    expect(activeCount(none)).toBe(0);
    expect(activeCount({ ...none, maxYears: 0 })).toBe(1); // zero is a real limit
    expect(
      activeCount({ ...none, locations: ["latam"], excludeTitles: ["sales"], maxYears: 3 }),
    ).toBe(3);
  });
});

describe("PreferencesPanel", () => {
  it("starts open when there are no filters and folded when there are", () => {
    const { unmount } = renderPanel();
    expect(screen.getByRole("group", { name: "Experience they ask for" })).toBeVisible();
    unmount();

    renderPanel({ ...none, locations: ["latam"] });
    expect(
      screen.getByRole("group", { name: "Experience they ask for", hidden: true }),
    ).not.toBeVisible();
    expect(screen.getByText("1 active")).toBeInTheDocument();
  });

  it("opens again from the header", async () => {
    renderPanel({ ...none, locations: ["latam"] });
    await userEvent.click(screen.getByRole("button", { name: "Show filters" }));
    expect(screen.getByRole("group", { name: "Experience they ask for" })).toBeVisible();
  });

  it("nothing to apply until something changes", async () => {
    renderPanel();
    expect(apply()).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Up to 3 years" }));
    expect(apply()).toBeEnabled();
    expect(screen.getByText("You have changes not applied yet.")).toBeInTheDocument();
  });

  it("picks the experience limit with one click and says what it does", async () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "No limit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Up to 3 years" }));
    expect(screen.getByRole("button", { name: "Up to 3 years" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(/senior roles and those asking for more than 3 years/i),
    ).toBeInTheDocument();
  });

  it("a saved limit outside the presets is still shown, selected", () => {
    renderPanel({ ...none, maxYears: 2 });
    return userEvent.click(screen.getByRole("button", { name: "Show filters" })).then(() => {
      expect(screen.getByRole("button", { name: "Up to 2 years" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("adds a value with Enter or a comma, as a chip that can be removed", async () => {
    renderPanel();
    const field = screen.getByLabelText("Hide titles containing");
    await userEvent.type(field, "sales{Enter}intern,");
    expect(screen.getByRole("button", { name: "Remove sales" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove intern" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove sales" }));
    expect(screen.queryByRole("button", { name: "Remove sales" })).not.toBeInTheDocument();
  });

  it("does not repeat a value, whatever its case", async () => {
    renderPanel({ ...none, excludeTitles: ["Senior"] });
    await userEvent.click(screen.getByRole("button", { name: "Show filters" }));
    await userEvent.type(screen.getByLabelText("Hide titles containing"), "senior{Enter}");
    expect(screen.getAllByRole("button", { name: /^Remove senior$/i })).toHaveLength(1);
  });

  it("a suggestion adds in one click and stops being offered", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Add latam" }));
    expect(screen.getByRole("button", { name: "Remove latam" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add latam" })).not.toBeInTheDocument();
  });

  it("text left in a field when focus moves away is kept", async () => {
    renderPanel();
    await userEvent.type(screen.getByLabelText("Technologies it must ask for"), "rust");
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Remove rust" })).toBeInTheDocument();
  });

  it("sends every filter together when applying", async () => {
    renderPanel({ ...none, excludeText: ["unpaid"] });
    await userEvent.click(screen.getByRole("button", { name: "Show filters" }));
    await userEvent.click(screen.getByRole("button", { name: "Up to 3 years" }));
    await userEvent.click(screen.getByRole("button", { name: "Add worldwide" }));
    await userEvent.click(apply());

    await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(1));
    expect(savePreferences).toHaveBeenCalledWith({
      ...none,
      excludeText: ["unpaid"],
      locations: ["worldwide"],
      maxYears: 3,
    });
    await waitFor(() => expect(apply()).toBeDisabled());
  });

  it("clear all saves an empty set of filters", async () => {
    renderPanel({ ...none, maxYears: 3, locations: ["latam"] });
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    await waitFor(() => expect(savePreferences).toHaveBeenCalledWith(none));
    expect(screen.getByText("0 active")).toBeInTheDocument();
  });
});
