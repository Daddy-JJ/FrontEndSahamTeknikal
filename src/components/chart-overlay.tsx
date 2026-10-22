"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartPanel } from "./chart-panel";
import { chartPageRequest } from "@/lib/chart-navigation";
import { returnPage, scrollRecord, scrollStorageKey } from "@/lib/chart-return-scroll";
import { createClient } from "@/lib/supabase/client";
import styles from "./chart-overlay.module.css";

type ChartChoice = NonNullable<ReturnType<typeof chartPageRequest>>;
type Origin = {
  x: number; y: number; page: string; opener: HTMLAnchorElement;
  regions: { element: HTMLElement; left: number; top: number }[];
};
type Choice = { chart: ChartChoice; origin: Origin };
type Scope = { mode: "live" | "fixture"; ownerId: string };
const OverlayContext = createContext<((anchor: HTMLAnchorElement) => boolean) | null>(null);
const plainClick = (event: MouseEvent | React.MouseEvent) => event.button === 0
  && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
const regions = () => [...document.querySelectorAll<HTMLElement>(".reporting-list, .table-scroll, .journal-table-scroll")]
  .filter(element => !element.closest("[data-chart-overlay-host]")).slice(0, 24);

function lockPage(origin: Origin) {
  const body = document.body;
  const keys = ["position", "top", "left", "width", "overflow", "padding-right"];
  const previous = keys.map(key => [key, body.style.getPropertyValue(key), body.style.getPropertyPriority(key)]);
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
  body.style.position = "fixed";
  body.style.top = `${-origin.y}px`;
  body.style.left = `${-origin.x}px`;
  body.style.width = "100%";
  body.style.overflow = "hidden";
  if (gutter > 0) body.style.paddingRight = `${padding + gutter}px`;
  return () => {
    for (const [key, value, priority] of previous) {
      if (value) body.style.setProperty(key, value, priority);
      else body.style.removeProperty(key);
    }
    for (const region of origin.regions) if (region.element.isConnected) {
      region.element.scrollLeft = region.left; region.element.scrollTop = region.top;
    }
    window.scrollTo({ left: origin.x, top: origin.y, behavior: "instant" });
  };
}

function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
    'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]',
  )].filter(element => element.getClientRects().length > 0);
  const first = controls[0], last = controls.at(-1);
  if (!first || !last) { event.preventDefault(); event.currentTarget.focus(); return; }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function ChartDialog({ choice, mode, ownerId, onClose }: Scope & { choice: Choice; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);
  useLayoutEffect(() => {
    const element = dialog.current!;
    const restore = lockPage(choice.origin);
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close(); restore();
      if (leaving.current) return;
      if (choice.origin.opener.isConnected) choice.origin.opener.focus({ preventScroll: true });
      else {
        const heading = document.querySelector<HTMLElement>("main h1");
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
    };
  }, [choice]);
  useEffect(() => {
    // Observe existing Auth only; never send credentials or fetch a second owner identity.
    const { data } = createClient().auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.id !== ownerId) onClose();
    });
    return () => data.subscription.unsubscribe();
  }, [ownerId, onClose]);
  const fullPage = (event: React.MouseEvent) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[data-chart-overlay-fullpage]") : null;
    if (!anchor || !plainClick(event)) return;
    const origin = choice.origin;
    const record = scrollRecord(mode, origin.page, origin.y,
      origin.regions.map((region, index) => ({ index, left: region.left, top: region.top })), Date.now());
    if (record) try { sessionStorage.setItem(scrollStorageKey(mode), JSON.stringify(record)); } catch { /* Optional UI storage. */ }
    leaving.current = true;
  };
  return <dialog ref={dialog} id="reporting-chart-overlay" className={styles.dialog} data-chart-overlay-host=""
    aria-labelledby="reporting-chart-title" onKeyDown={trapFocus} onClickCapture={fullPage}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className={styles.header}>
      <div><span>CHART / {choice.chart.request.context.toUpperCase()}</span><h2 id="reporting-chart-title">Chart {choice.chart.request.ticker}</h2></div>
      <button ref={closeButton} type="button" onClick={onClose}>Tutup overlay chart</button>
    </header>
    <div className={styles.body}>
      <ChartPanel key={JSON.stringify([ownerId, mode, choice.chart.request])} request={choice.chart.request} mode={mode}
        initialIndicators={choice.chart.initialIndicators} returnTo={choice.origin.page} initiallyOpen onClose={onClose} overlay />
    </div>
  </dialog>;
}

function OverlayHost({ mode, ownerId, page, children }: Scope & { page: string; children: ReactNode }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const active = useRef(false);
  const close = useCallback(() => { active.current = false; setChoice(null); }, []);
  const open = useCallback((anchor: HTMLAnchorElement) => {
      const url = new URL(anchor.href);
      const match = /^\/chart\/([A-Z0-9_-]{1,20})$/.exec(url.pathname);
      if (url.origin !== location.origin || !match || !returnPage(page)) return false;
      const chart = chartPageRequest(match[1], url.searchParams);
      if (!chart || chart.request.context === "latest") return false;
      if (active.current) return true;
      active.current = true;
      setChoice({ chart, origin: { page, opener: anchor, x: window.scrollX, y: window.scrollY,
        regions: regions().map(element => ({ element, left: element.scrollLeft, top: element.scrollTop })) } });
      return true;
  }, [page]);
  return <OverlayContext value={open}>{children}{choice && <ChartDialog choice={choice} mode={mode} ownerId={ownerId} onClose={close} />}</OverlayContext>;
}

export function ChartOverlayLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const open = useContext(OverlayContext);
  return <Link prefetch={false} href={href} aria-label={label} aria-haspopup={open ? "dialog" : undefined} data-chart-overlay={open ? "true" : undefined}
    onClick={event => {
      if (!event.defaultPrevented && plainClick(event) && open?.(event.currentTarget)) event.preventDefault();
    }}>{children}</Link>;
}

/** Local selection only. Route/cohort/account changes destroy the previous chart and its resources. */
export function ReportingChartOverlay({ mode, ownerId, children }: Scope & { children: ReactNode }) {
  const path = usePathname(), search = useSearchParams().toString();
  const page = path + (search ? "?" + search : "");
  return <OverlayHost key={JSON.stringify([page, ownerId, mode])} page={page} mode={mode} ownerId={ownerId}>{children}</OverlayHost>;
}
