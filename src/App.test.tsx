import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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

describe("App", () => {
  beforeEach(async () => {
    await resetFakeDatabase();
  });

  it("moves to the first character in a selected category", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "한글" }));

    const koreanStart = getFirstGlobalIndexForCategory("korean");
    expect(
      screen.getByText(`전체 · ${koreanStart + 1} / ${FONT_CHARACTERS.length}`)
    ).toBeInTheDocument();
  });

  it("updates category when navigation crosses a boundary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "대문자" }));

    for (let index = 0; index < 26; index += 1) {
      await user.click(screen.getByRole("button", { name: "다음 글자로 이동" }));
    }

    expect(screen.getByText("소문자 · 1 / 26")).toBeInTheDocument();
  });

  it("disables first and final navigation buttons at the list edges", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByRole("button", { name: "이전 글자로 이동" })
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "한글" }));

    for (
      let index = getFirstGlobalIndexForCategory("korean");
      index < FONT_CHARACTERS.length - 1;
      index += 1
    ) {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    }

    expect(screen.getByRole("button", { name: "다음 글자로 이동" })).toBeDisabled();
  });
});

