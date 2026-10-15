"use client";
import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import type { CanvasProps } from "./chart-canvas";

export const loadChartCanvas = () => import("./chart-canvas");

class RendererFailureBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Closed panels never mount this boundary or import the canvas chunk. */
export function ChartRenderer(props: CanvasProps) {
  // A retry remount creates a fresh React.lazy instance, without retaining a rejected lazy promise.
  const [Canvas] = useState(() => lazy(loadChartCanvas));
  return <RendererFailureBoundary onError={props.onError}>
    <Suspense fallback={<p role="status">Memuat renderer chart…</p>}><Canvas {...props} /></Suspense>
  </RendererFailureBoundary>;
}
