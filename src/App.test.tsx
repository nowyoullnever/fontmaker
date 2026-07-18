import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import {
  FONT_CHARACTERS,
  getFirstGlobalIndexForCategory
} from "./data/characterSet";
import { resetDatabaseConnectionForTests } from "./storage/database";

async function resetFakeDatabase() {
  resetDatabaseConnectionForTests();
  await indexedDB.deleteDatabase("fontmaker");
}

async function renderLoadedApp() {
  const rendered = render(<App />);
  await waitFor(() =>
    expect(rendered.container.querySelector(".workspace")).not.toBeNull()
  );
  return rendered;
}

function getCategoryButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(".category-button")
  );
}

function getNavigationButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(".character-navigation button")
  );
}

function drawStroke(container: HTMLElement) {
  const canvas = container.querySelector("canvas") as HTMLCanvasElement;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    bottom: 300,
    height: 300,
    left: 0,
    right: 300,
    top: 0,
    width: 300,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });

  fireEvent.pointerDown(canvas, {
    clientX: 30,
    clientY: 30,
    pointerId: 1,
    pointerType: "mouse",
    pressure: 0
  });
  fireEvent.pointerMove(canvas, {
    clientX: 150,
    clientY: 150,
    pointerId: 1,
    pointerType: "mouse",
    pressure: 0
  });
  fireEvent.pointerUp(canvas, {
    clientX: 150,
    clientY: 150,
    pointerId: 1,
    pointerType: "mouse",
    pressure: 0
  });
}

function getCompleteButton(container: HTMLElement) {
  return container.querySelector(".complete-button") as HTMLButtonElement;
}

function getClearGlyphButton(container: HTMLElement) {
  return container.querySelector(
    ".drawing-toolbar .danger-button"
  ) as HTMLButtonElement;
}

describe("App", () => {
  beforeEach(async () => {
    await resetFakeDatabase();
  });

  it("moves to the first character in a selected category", async () => {
    const user = userEvent.setup();
    const { container } = await renderLoadedApp();
    const koreanStart = getFirstGlobalIndexForCategory("korean");

    await user.click(getCategoryButtons(container)[4]);

    expect(container.querySelector(".status-panel")?.textContent).toContain(
      `${koreanStart + 1} / ${FONT_CHARACTERS.length}`
    );
  });

  it("updates category when navigation crosses a boundary", async () => {
    const user = userEvent.setup();
    const { container } = await renderLoadedApp();
    const [, nextButton] = getNavigationButtons(container);

    await user.click(getCategoryButtons(container)[0]);

    for (let index = 0; index < 26; index += 1) {
      await user.click(nextButton);
    }

    expect(container.querySelector(".status-panel")?.textContent).toContain(
      `27 / ${FONT_CHARACTERS.length}`
    );
  });

  it("disables first and final navigation buttons at the list edges", async () => {
    const user = userEvent.setup();
    const { container } = await renderLoadedApp();
    const [previousButton, nextButton] = getNavigationButtons(container);

    expect(previousButton).toBeDisabled();

    await user.click(getCategoryButtons(container)[4]);

    for (
      let index = getFirstGlobalIndexForCategory("korean");
      index < FONT_CHARACTERS.length - 1;
      index += 1
    ) {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    }

    expect(nextButton).toBeDisabled();
  });

  it("automatically completes a drawn character when moving next", async () => {
    const user = userEvent.setup();
    const { container } = await renderLoadedApp();
    const [previousButton, nextButton] = getNavigationButtons(container);

    drawStroke(container);
    await waitFor(() => expect(getCompleteButton(container)).not.toBeDisabled());

    await user.click(nextButton);
    await user.click(previousButton);

    expect(getCompleteButton(container)).toHaveAttribute("aria-pressed", "true");
  });

  it("clears every drawn font and completion state from data management", async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container } = await renderLoadedApp();
    const [previousButton, nextButton] = getNavigationButtons(container);

    drawStroke(container);
    await waitFor(() => expect(getClearGlyphButton(container)).not.toBeDisabled());
    await user.click(nextButton);
    (container.querySelector(".data-management") as HTMLDetailsElement).open = true;
    await user.click(screen.getByRole("button", { name: "그린 폰트 모두 지우기" }));
    await user.click(previousButton);

    await waitFor(() => expect(getClearGlyphButton(container)).toBeDisabled());
    expect(getCompleteButton(container)).toHaveAttribute("aria-pressed", "false");
    expect(confirmMock).toHaveBeenCalled();
    confirmMock.mockRestore();
  });

  it("undoes the current character drawing with Ctrl+Z", async () => {
    const { container } = await renderLoadedApp();
    drawStroke(container);

    const clearButton = getClearGlyphButton(container);
    await waitFor(() => expect(clearButton).not.toBeDisabled());

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });

    await waitFor(() => expect(clearButton).toBeDisabled());
  });
});
