import { useEffect, useRef, useState } from "react";
import {
  clientPointToNormalizedPoint,
  normalizedWidthToPixels
} from "../drawing/coordinateUtils";
import { findTouchedStrokeIds } from "../drawing/eraserUtils";
import { renderDrawing, renderStroke } from "../drawing/strokeRenderer";
import type {
  DrawingStroke,
  DrawingTool,
  GlyphDrawing,
  NormalizedPoint
} from "../drawing/drawingTypes";

const ERASER_RADIUS = 0.035;

type DrawingCanvasProps = {
  drawing: GlyphDrawing;
  tool: DrawingTool;
  brushWidth: number;
  character: string;
  categoryLabel: string;
  onCommitStroke: (stroke: DrawingStroke) => void;
  onEraseStrokes: (strokeIds: string[]) => void;
  onGestureActiveChange: (isActive: boolean) => void;
};

function createStrokeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(1, Math.round(rect.width));
  const pixelRatio = window.devicePixelRatio || 1;
  const bitmapSize = Math.max(1, Math.round(size * pixelRatio));

  if (canvas.width !== bitmapSize || canvas.height !== bitmapSize) {
    canvas.width = bitmapSize;
    canvas.height = bitmapSize;
  }

  const context = canvas.getContext("2d");
  if (context) {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  return size;
}

export function DrawingCanvas({
  drawing,
  tool,
  brushWidth,
  character,
  categoryLabel,
  onCommitStroke,
  onEraseStrokes,
  onGestureActiveChange
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const erasedStrokeIdsRef = useRef<Set<string>>(new Set());
  const drawingRef = useRef(drawing);
  const canvasSizeRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState(0);

  drawingRef.current = drawing;

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const size = resizeCanvasToDisplaySize(canvas);
    if (canvasSizeRef.current !== size) {
      canvasSizeRef.current = size;
      setCanvasSize(size);
    }
    context.clearRect(0, 0, size, size);
    renderDrawing(context, drawingRef.current, size);

    if (activeStrokeRef.current) {
      renderStroke(context, activeStrokeRef.current, size);
    }
  };

  useEffect(() => {
    redraw();
  }, [drawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", redraw);
      redraw();

      return () => window.removeEventListener("resize", redraw);
    }

    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    redraw();

    return () => observer.disconnect();
  }, []);

  const getPointFromPointerEvent = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): NormalizedPoint => {
    const rect = event.currentTarget.getBoundingClientRect();

    return clientPointToNormalizedPoint(
      event.clientX,
      event.clientY,
      rect,
      event.pressure,
      event.pointerType,
      event.timeStamp
    );
  };

  const eraseAtPoint = (point: NormalizedPoint) => {
    const touchedStrokeIds = findTouchedStrokeIds(
      drawingRef.current.strokes.filter(
        (stroke) => !erasedStrokeIdsRef.current.has(stroke.id)
      ),
      point,
      ERASER_RADIUS
    );

    touchedStrokeIds.forEach((strokeId) => erasedStrokeIdsRef.current.add(strokeId));

    if (touchedStrokeIds.length > 0) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      const size = resizeCanvasToDisplaySize(canvas);
      context.clearRect(0, 0, size, size);
      renderDrawing(
        context,
        {
          strokes: drawingRef.current.strokes.filter(
            (stroke) => !erasedStrokeIdsRef.current.has(stroke.id)
          )
        },
        size
      );
    }
  };

  const endGesture = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (tool === "pen" && activeStrokeRef.current) {
      onCommitStroke(activeStrokeRef.current);
    }

    if (tool === "eraser" && erasedStrokeIdsRef.current.size > 0) {
      onEraseStrokes(Array.from(erasedStrokeIdsRef.current));
    }

    activePointerIdRef.current = null;
    activeStrokeRef.current = null;
    erasedStrokeIdsRef.current = new Set();
    onGestureActiveChange(false);
    redraw();
  };

  const cancelGesture = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerIdRef.current = null;
    activeStrokeRef.current = null;
    erasedStrokeIdsRef.current = new Set();
    onGestureActiveChange(false);
    redraw();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    onGestureActiveChange(true);

    const point = getPointFromPointerEvent(event);

    if (tool === "pen") {
      activeStrokeRef.current = {
        id: createStrokeId(),
        width: brushWidth,
        points: [point]
      };
      redraw();
      return;
    }

    erasedStrokeIdsRef.current = new Set();
    eraseAtPoint(point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const point = getPointFromPointerEvent(event);

    if (tool === "pen" && activeStrokeRef.current) {
      activeStrokeRef.current = {
        ...activeStrokeRef.current,
        points: [...activeStrokeRef.current.points, point]
      };
      redraw();
      return;
    }

    if (tool === "eraser") {
      eraseAtPoint(point);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      aria-label={`${categoryLabel} ${character} 손글씨 입력 캔버스`}
      tabIndex={0}
      data-canvas-size={canvasSize}
      data-brush-pixel-width={normalizedWidthToPixels(brushWidth, canvasSize)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={cancelGesture}
    />
  );
}
