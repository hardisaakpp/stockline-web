import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import type { AskResult } from "../schemas";
import { useChat } from "../use-chat";
import { ChatPanel } from "./chat-panel";

const askAssistant = vi.fn<(values: unknown) => Promise<AskResult>>();
vi.mock("../actions.server", () => ({ askAssistant: (values: unknown) => askAssistant(values) }));

const quota = { limit: 30, remaining: 29, renewsInSeconds: 600, warning: false };
const answered = (text: string): AskResult => ({
  ok: true,
  answer: {
    text,
    sources: [{ path: "orders-import.md", title: "Importing an order" }],
    tools: [],
    references: [],
    noAnswer: false,
    quota,
  },
});

function Harness({ permissions }: { permissions: string[] }) {
  const chat = useChat();
  return <ChatPanel chat={chat} permissions={permissions} />;
}

function renderPanel(permissions = ["orders.view", "orders.import"]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness permissions={permissions} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  askAssistant.mockReset();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ChatPanel", () => {
  it("greets and offers starter questions that match the person's permissions", () => {
    renderPanel(["orders.view"]);

    expect(screen.getByText("Hi, I'm Xia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What do the order statuses mean?" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "How do I import an order?" })).toBeNull();
  });

  it("asks a starter question and shows the answer, its sources and the remaining quota", async () => {
    askAssistant.mockResolvedValue(answered("Open **Orders**, then *Import order*."));
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "How do I import an order?" }));

    expect(await screen.findByText("Importing an order")).toBeVisible();
    expect(screen.getByText("Orders", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("29 questions left of 30")).toBeVisible();
    expect(askAssistant).toHaveBeenCalledWith({
      question: "How do I import an order?",
      history: [],
    });
  });

  it("sends on Enter, keeps Shift+Enter for new lines, and remembers the conversation", async () => {
    askAssistant
      .mockResolvedValueOnce(answered("First answer."))
      .mockResolvedValueOnce(answered("Second."));
    renderPanel();
    const box = screen.getByRole("textbox", { name: "Your question" });

    await userEvent.type(box, "first{Shift>}{Enter}{/Shift}line two");
    expect(askAssistant).not.toHaveBeenCalled();
    await userEvent.type(box, "{Enter}");
    await screen.findByText("First answer.");

    await userEvent.type(box, "and then?{Enter}");
    await screen.findByText("Second.");

    expect(askAssistant).toHaveBeenNthCalledWith(1, { question: "first\nline two", history: [] });
    expect(askAssistant).toHaveBeenNthCalledWith(2, {
      question: "and then?",
      history: [
        { role: "user", text: "first\nline two" },
        { role: "assistant", text: "First answer." },
      ],
    });
  });

  it("offers a retry after a temporary failure without repeating the question", async () => {
    askAssistant
      .mockResolvedValueOnce({ ok: false, code: "busy" })
      .mockResolvedValueOnce(answered("Here you go."));
    renderPanel();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Your question" }),
      "hello there{Enter}",
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Xia is busy right now");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await screen.findByText("Here you go.");
    expect(screen.getAllByText("hello there")).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(askAssistant).toHaveBeenLastCalledWith({ question: "hello there", history: [] });
  });

  it("explains when the quota renews and does not offer a pointless retry", async () => {
    askAssistant.mockResolvedValue({ ok: false, code: "quotaExhausted", retryAfterSeconds: 7300 });
    renderPanel();

    await userEvent.type(screen.getByRole("textbox", { name: "Your question" }), "one more{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("They renew in 3 hours.");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("explains in the interface language when the documentation does not cover the question", async () => {
    askAssistant.mockResolvedValue({
      ok: true,
      answer: {
        text: "No encontré información sobre eso.",
        sources: [],
        tools: [],
        references: [],
        noAnswer: true,
        quota,
      },
    });
    renderPanel();

    await userEvent.type(screen.getByRole("textbox", { name: "Your question" }), "weather?{Enter}");

    expect(await screen.findByText(/I couldn't find that in the documentation/)).toBeVisible();
    expect(screen.queryByText(/No encontré/)).toBeNull();
  });

  it("starts over with a new conversation", async () => {
    askAssistant.mockResolvedValue(answered("Done."));
    renderPanel();
    await userEvent.type(screen.getByRole("textbox", { name: "Your question" }), "hi{Enter}");
    await screen.findByText("Done.");

    await userEvent.click(screen.getByRole("button", { name: "New conversation" }));

    await waitFor(() => expect(screen.getByText("Hi, I'm Xia")).toBeVisible());
  });
});
