"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { returnPage, scrollRecord, parseScrollRecord, scrollStorageKey } from "@/lib/chart-return-scroll";
const regions = () => [...document.querySelectorAll<HTMLElement>(".reporting-list, .table-scroll, .journal-table-scroll")].slice(0, 24);
/** A UI-only island. The server shell and every data read remain unchanged. */
export function ChartReturnPosition({ mode }: { mode: "live" | "fixture" | null }) {
  const path = usePathname(), search = useSearchParams().toString();
  useEffect(() => {
    if (!mode) {
      try { for (const m of ["live", "fixture"] as const) sessionStorage.removeItem(scrollStorageKey(m)); } catch { /* Storage can be disabled; positions are optional. */ }
      return;
    }
    const current = path + (search ? "?" + search : "");
    const key = scrollStorageKey(mode);
    let firstFrame = 0, secondFrame = 0;
    try {
      const record = parseScrollRecord(sessionStorage.getItem(key), mode, current, Date.now());
      if (record) {
        // Apply after the destination's server-rendered tables have mounted.
        firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => {
          const tables = regions();
          for (const item of record.regions) { const table = tables[item.index]; if (table) { table.scrollLeft = item.left; table.scrollTop = item.top; } }
          window.scrollTo({ top: record.y, behavior: "instant" });
          try { sessionStorage.removeItem(key); } catch { /* Optional UI storage. */ }
        }); });
      }
    } catch { /* Never turn unavailable UI storage into a data failure. */ }
    const capture = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !returnPage(current)) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      // Overlay fullpage persists the pre-lock coordinates itself; ordinary triggers stay local.
      if (anchor.dataset.chartOverlay === "true" || anchor.closest("[data-chart-overlay-host]")) return;
      const destination = new URL(anchor.href);
      if (destination.origin !== location.origin || !/^\/(chart\/|journal\/(?:paper\/)?)/.test(destination.pathname)
          || returnPage(destination.searchParams.get("return_to") ?? "") !== returnPage(current)) return;
      const record = scrollRecord(mode, current, window.scrollY, regions().map((table, index) => ({ index, left: table.scrollLeft, top: table.scrollTop })), Date.now());
      if (record) try { sessionStorage.setItem(key, JSON.stringify(record)); } catch { /* Storage denied; navigation still works. */ }
    };
    document.addEventListener("click", capture, true);
    return () => { document.removeEventListener("click", capture, true); cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [mode, path, search]);
  return null;
}
