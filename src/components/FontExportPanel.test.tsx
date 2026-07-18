import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FontExportPanel } from "./FontExportPanel";

vi.mock("../font/downloadFont", () => ({
  downloadTtf: vi.fn()
}));

const drawingState = {
  65: {
    drawing: {
      strokes: [
        {
          id: "stroke",
          width: 0.025,
          points: [
            { x: 0.2, y: 0.2, pressure: 0.65, timestamp: 1 },
            { x: 0.8, y: 0.8, pressure: 0.65, timestamp: 2 }
          ]
        }
      ]
    },
    undoStack: [],
    redoStack: []
  }
};

describe("FontExportPanel", () => {
  it("does not display fake numerical export progress", async () => {
    const user = userEvent.setup();
    render(
      <FontExportPanel
        drawingState={drawingState}
        completedCodePoints={new Set([65])}
      />
    );

    await user.click(screen.getByRole("button", { name: "TTF 파일 만들기" }));

    expect(screen.getByText("폰트를 만들었습니다.")).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).not.toBeInTheDocument();
  });
});
