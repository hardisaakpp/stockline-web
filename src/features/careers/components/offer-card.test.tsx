import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import type { OfferItem } from "../schemas";
import { OfferCard } from "./offer-card";
import { parseViewed } from "../use-viewed-offers";

const offer: OfferItem = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Backend Engineer",
  company: "Acme",
  location: "Worldwide",
  source: "remotive",
  alsoOn: [],
  url: "https://example.com/job/1",
  publishedAt: null,
  score: 80,
  matches: [".NET"],
  applicationId: null,
  applicationStatus: null,
  requiredYears: null,
};

const handlers = () => ({
  onPrepare: vi.fn(),
  onOpen: vi.fn(),
  onUnview: vi.fn(),
  onReopen: vi.fn(),
});

const renderCard = (item: Partial<OfferItem> = {}, viewed = false, h = handlers()) => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <OfferCard offer={{ ...offer, ...item }} busy={false} viewed={viewed} {...h} />
    </NextIntlClientProvider>,
  );
  return h;
};

beforeEach(() => window.localStorage.clear());

describe("OfferCard experience", () => {
  it("says how many years the offer asks for", () => {
    renderCard({ requiredYears: 5 });
    expect(screen.getByText("Asks for 5+ years of experience")).toBeInTheDocument();
  });

  it("says so when the offer does not state it", () => {
    renderCard({ requiredYears: null });
    expect(screen.getByText("No experience stated")).toBeInTheDocument();
  });
});

describe("OfferCard viewed", () => {
  it("opening the offer is reported, with a click or a middle click", async () => {
    const h = renderCard();
    const link = screen.getByRole("link", { name: /view offer/i });
    link.addEventListener("click", (e) => e.preventDefault()); // jsdom does not navigate
    await userEvent.click(link);
    expect(h.onOpen).toHaveBeenCalledTimes(1);
  });

  it("a card not yet opened is plain; an opened one says Viewed and can be taken back", async () => {
    const { rerender } = render(<></>);
    rerender(<></>);
    const h = renderCard({}, true);
    expect(screen.getByText("Viewed")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark as not viewed" }));
    expect(h.onUnview).toHaveBeenCalledTimes(1);
  });

  it("an unopened card shows no Viewed mark", () => {
    renderCard({}, false);
    expect(screen.queryByText("Viewed")).not.toBeInTheDocument();
  });

  it("an opened card is tinted differently from an unopened one", () => {
    const { container: a } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <OfferCard offer={offer} busy={false} viewed={false} {...handlers()} />
      </NextIntlClientProvider>,
    );
    const { container: b } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <OfferCard offer={offer} busy={false} viewed {...handlers()} />
      </NextIntlClientProvider>,
    );
    expect(a.querySelector("[data-slot=card]")!.className).not.toContain("bg-primary/10");
    expect(b.querySelector("[data-slot=card]")!.className).toContain("bg-primary/10");
  });
});

describe("OfferCard discarded application", () => {
  it("offers to reopen a discarded application, and only then", async () => {
    const h = renderCard({
      applicationId: "22222222-2222-4222-8222-222222222222",
      applicationStatus: "Discarded",
    });
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
    expect(h.onReopen).toHaveBeenCalledTimes(1);
  });

  it("a draft or sent application has no reopen button", () => {
    renderCard({
      applicationId: "22222222-2222-4222-8222-222222222222",
      applicationStatus: "Sent",
    });
    expect(screen.queryByRole("button", { name: "Reopen" })).not.toBeInTheDocument();
  });
});

describe("parseViewed", () => {
  it("keeps the ids and ignores anything else", () => {
    expect(parseViewed('["a","b"]')).toEqual(["a", "b"]);
    expect(parseViewed('["a",1,null]')).toEqual(["a"]);
    expect(parseViewed("{}")).toEqual([]);
    expect(parseViewed("garbage")).toEqual([]);
    expect(parseViewed(null)).toEqual([]);
  });
});
