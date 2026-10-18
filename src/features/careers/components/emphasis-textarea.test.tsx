import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import { EmphasisText } from "./emphasis-text";
import { EmphasisTextarea } from "./emphasis-textarea";

function Harness({ initial, seen }: { initial: string; seen?: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmphasisTextarea
        aria-label="Summary"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          seen?.(event.target.value);
        }}
      />
    </NextIntlClientProvider>
  );
}

const field = () => screen.getByLabelText("Summary") as HTMLTextAreaElement;
const select = (from: number, to: number) => {
  field().focus();
  field().setSelectionRange(from, to);
};

describe("EmphasisTextarea", () => {
  it("puts the selected text in bold with the button and keeps it selected", async () => {
    const seen = vi.fn();
    render(<Harness initial="Experto en FastAPI hoy" seen={seen} />);
    select(11, 18);

    await userEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(field().value).toBe("Experto en **FastAPI** hoy");
    expect(seen).toHaveBeenLastCalledWith("Experto en **FastAPI** hoy");
    expect([field().selectionStart, field().selectionEnd]).toEqual([13, 20]);
  });

  it("takes the bold off when the same text is highlighted again", async () => {
    render(<Harness initial="Experto en **FastAPI** hoy" />);
    select(13, 20);

    await userEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(field().value).toBe("Experto en FastAPI hoy");
  });

  it("answers to Ctrl+B without leaving the field", async () => {
    render(<Harness initial="uno dos tres" />);
    select(4, 7);

    await userEvent.keyboard("{Control>}b{/Control}");

    expect(field().value).toBe("uno **dos** tres");
  });

  it("does nothing when there is no word to highlight", async () => {
    const seen = vi.fn();
    render(<Harness initial="uno  dos" seen={seen} />);
    select(4, 4);

    await userEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(field().value).toBe("uno  dos");
    expect(seen).not.toHaveBeenCalled();
  });
});

describe("EmphasisText", () => {
  it("shows the marked words in bold and no marks", () => {
    const { container } = render(<EmphasisText text="Experto en **FastAPI** y Celery" />);
    expect(container).toHaveTextContent("Experto en FastAPI y Celery");
    expect(container.querySelector("strong")).toHaveTextContent("FastAPI");
  });
});
