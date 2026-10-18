import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import type { Cv } from "../schemas";
import { CvForm } from "./cv-form";

const base: Cv = {
  fullName: "",
  headline: "",
  summary: "",
  contact: { email: "", links: {}, phone: null, location: null },
  experience: [],
  research: [],
  projects: [],
  education: [],
  skills: [
    { name: "Backend", items: ["C#", ".NET"] },
    { name: "Frontend", items: ["React"] },
    { name: "Tools", items: ["Docker"] },
  ],
  certifications: [],
  languages: [],
  references: [],
  hidden: [],
};

const seen = vi.fn<(cv: Cv) => void>();
const latest = (): Cv => seen.mock.lastCall![0];

function Harness({ initial }: { initial: Cv }) {
  const [cv, setCv] = useState(initial);
  useEffect(() => seen(cv), [cv]);
  return <CvForm cv={cv} onChange={(patch) => setCv((c) => ({ ...c, ...patch }))} />;
}

const renderForm = (initial: Cv = base) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness initial={initial} />
    </NextIntlClientProvider>,
  );

const handle = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^Move ${name} \\(`) });
const card = (name: string) => handle(name).closest("[data-reorder-card]") as HTMLElement;
const order = () => latest().skills.map((g) => g.name);
const shownGroups = () =>
  screen.getAllByLabelText<HTMLInputElement>("Group").map((input) => input.value);
const shownSkills = () =>
  screen.getAllByLabelText<HTMLInputElement>("Skills").map((input) => input.value);

/** jsdom has no DragEvent, so it drops `clientY`: it is set on the event by hand. */
const dragOver = (target: HTMLElement, dataTransfer: object, clientY: number) => {
  const event = createEvent.dragOver(target, { dataTransfer });
  Object.defineProperty(event, "clientY", { value: clientY });
  fireEvent(target, event);
};

const transfer = () => ({
  setData: vi.fn(),
  setDragImage: vi.fn(),
  effectAllowed: "",
  dropEffect: "",
});

describe("reordering skill groups", () => {
  beforeEach(() => seen.mockReset());

  it("moves a group down and up with the arrow keys, and the grip keeps the focus", async () => {
    renderForm();
    const grip = handle("Backend");
    grip.focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(order()).toEqual(["Frontend", "Backend", "Tools"]);
    expect(grip).toHaveFocus();
    expect(grip).toHaveAccessibleName(/position 2 of 3/);

    await userEvent.keyboard("{ArrowDown}{ArrowUp}{ArrowUp}");
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);
  });

  it("stops at both ends instead of wrapping around", async () => {
    renderForm();
    handle("Backend").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);

    handle("Tools").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);
  });

  it("shows each group's own text after a move, including what the skills field was typing", async () => {
    renderForm();
    handle("Backend").focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(shownGroups()).toEqual(["Frontend", "Backend", "Tools"]);
    expect(shownSkills()).toEqual(["React", "C#, .NET", "Docker"]);
  });

  it("keeps a group collapsed when it moves", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Collapse Backend" }));
    handle("Backend").focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(screen.getByRole("button", { name: "Expand Backend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse Frontend" })).toBeInTheDocument();
  });

  it("drops a dragged group before the row when the pointer is on its upper half", () => {
    renderForm();
    const data = transfer();
    fireEvent.dragStart(handle("Tools"), { dataTransfer: data });
    dragOver(card("Frontend"), data, 0);
    fireEvent.drop(card("Frontend"), { dataTransfer: data });

    expect(order()).toEqual(["Backend", "Tools", "Frontend"]);
    expect(data.setData).toHaveBeenCalled();
  });

  it("drops it after the row when the pointer is on its lower half", () => {
    renderForm();
    const data = transfer();
    fireEvent.dragStart(handle("Backend"), { dataTransfer: data });
    dragOver(card("Tools"), data, 5);
    fireEvent.drop(card("Tools"), { dataTransfer: data });

    expect(order()).toEqual(["Frontend", "Tools", "Backend"]);
  });

  it("leaves everything as it was when dropped on itself, or when the drag is cancelled", () => {
    renderForm();
    const data = transfer();
    fireEvent.dragStart(handle("Frontend"), { dataTransfer: data });
    dragOver(card("Frontend"), data, 0);
    fireEvent.drop(card("Frontend"), { dataTransfer: data });
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);

    fireEvent.dragStart(handle("Tools"), { dataTransfer: data });
    fireEvent.dragEnd(handle("Tools"), { dataTransfer: data });
    fireEvent.drop(card("Backend"), { dataTransfer: data });
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);
  });

  it("ignores things dragged in from outside, such as a file", () => {
    renderForm();
    fireEvent.drop(card("Backend"), { dataTransfer: transfer() });
    expect(order()).toEqual(["Backend", "Frontend", "Tools"]);
  });

  it("a group added after a move starts at the end and the others keep their text", async () => {
    renderForm();
    handle("Backend").focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.click(screen.getByRole("button", { name: /add group/i }));

    expect(order()).toEqual(["Frontend", "Backend", "Tools", ""]);
    expect(shownSkills()).toEqual(["React", "C#, .NET", "Docker", ""]);
  });

  it("only the skills section can be reordered", () => {
    renderForm({
      ...base,
      skills: [],
      languages: [{ name: "English", level: "B2", include: true }],
    });
    expect(screen.queryAllByRole("button", { name: /^Move / })).toHaveLength(0);
  });
});
