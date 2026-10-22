"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  mergeChartPages,
  parseChartEnvelope,
  parseChartRequest,
  type ChartData,
  type ChartEnvelope,
  type ChartRequest,
  type ChartErrorCode,
} from "@/lib/chart-contract";
import { chartFailure } from "@/lib/chart-reader";
import {
  chartRequestUrl,
  formatChartMoney,
  formatChartVolume,
} from "@/lib/chart-render";
import styles from "./chart.module.css";
import { chartPageHref, chartViewRequest } from "@/lib/chart-navigation";
import { chartLabel, chartReason, chartFailureClearsData } from "@/lib/chart-presentation";
import { ChartRenderer, loadChartCanvas } from "./chart-renderer";
type Loader = (
  request: ChartRequest,
  cursor: string | undefined,
  signal: AbortSignal,
) => Promise<unknown>;
type Props = {
  request: ChartRequest;
  mode: "live" | "fixture";
  load?: Loader;
  fixture?: boolean;
  initialIndicators?: { sma10?: boolean; ema200?: boolean; macd?: boolean };
  initiallyOpen?: boolean;
  onClose?: () => void;
  returnTo?: string;
  overlay?: boolean;
};
const fetchChart: Loader = async (request, cursor, signal) => {
  const response = await fetch(chartRequestUrl(request, cursor), {
    signal,
    cache: "no-store",
    credentials: "same-origin",
  });
  return response.json();
};
function failureText(code: ChartErrorCode) {
  return {
    INVALID_REQUEST: "Filter atau konteks tidak valid.",
    UNAUTHENTICATED: "Masuk untuk membaca chart.",
    FORBIDDEN: "Akun tidak memiliki akses.",
    NOT_FOUND: "Emiten atau konteks tidak ditemukan.",
    REVISION_UNAVAILABLE:
      "Revisi berubah atau tidak tersedia. Muat ulang chart.",
    SNAPSHOT_UNAVAILABLE: "Snapshot historis belum dapat dibuktikan.",
    RATE_LIMITED: "Batas baca tercapai. Tunggu 60 detik sebelum mencoba lagi.",
    BACKEND_NOT_READY: "Backend chart belum siap.",
    DATA_UNAVAILABLE: "Data harga layak belum tersedia.",
    CONTRACT_ERROR: "Respons chart tidak sesuai kontrak.",
    UPSTREAM_ERROR: "Pembacaan chart gagal.",
    INTERNAL_ERROR: "Chart belum dapat ditampilkan.",
  }[code];
}
function ChartDetails({ data }: { data: ChartData }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  return (
    <>
      <details onToggle={event => setSourceOpen(event.currentTarget.open)}>
        <summary>Data & sumber</summary>
        {sourceOpen && <>
        <dl className={styles.source}>
          <dt>Provider / basis</dt>
          <dd>
            {data.source.provider} / {data.source.price_basis}
          </dd>
          <dt>Sesi harga terakhir</dt>
          <dd>{data.source.last_market_session}</dd>
          <dt>Scope</dt>
          <dd>{data.source.scope}</dd>
          <dt>Revision</dt>
          <dd>{data.revision}</dd>
          <dt>Receipt digest</dt>
          <dd>{data.source.input_digest}</dd>
          <dt>Resolved digest</dt>
          <dd>{data.source.resolved_input_digest}</dd>
          <dt>Waktu simpan</dt>
          <dd>{data.source.stored_at} — bukan waktu harga</dd>
        </dl>
        <p>Kode kualitas: {[...data.quality.reasons, ...data.quality.warnings].join(' · ') || '—'}</p>
        {data.signal_source && (
          <p>
            Sumber sinyal: {data.signal_source.resolved_input_digest} · cutoff{" "}
            {data.signal_source.resolved_cutoff}
          </p>
        )}
        </>}
      </details>
      <details onToggle={event => setTableOpen(event.currentTarget.open)}>
        <summary>Tabel OHLC & indikator — alternatif canvas</summary>
        {tableOpen &&
        <div
          className={styles.tableRegion}
          role="region"
          aria-label="Data chart"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Sesi</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Volume saham</th>
                <th>SMA10</th>
                <th>EMA200</th>
                <th>MACD</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => {
                const b = data.bars.find((b) => b.session === session);
                return (
                  <tr key={session}>
                    <th scope="row">{session}</th>
                    {(["open", "high", "low", "close"] as const).map((k) => (
                      <td key={k}>{b ? formatChartMoney(b[k]) : "—"}</td>
                    ))}
                    <td>{b ? formatChartVolume(b.volume) : "—"}</td>
                    {(["sma10", "ema200", "macd"] as const).map((k) => (
                      <td key={k}>
                        {data.indicators[k].points.find(
                          (p) => p.session === session,
                        )?.value ?? "—"}
                      </td>
                    ))}
                    <td>
                      {data.gaps.find((g) => g.session === session) ? <>{chartReason(data.gaps.find((g) => g.session === session)!.reason)} <code>({data.gaps.find((g) => g.session === session)!.reason})</code></> : "Valid"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </details>
      <details onToggle={event => setEventsOpen(event.currentTarget.open)}>
        <summary>
          Level & event canonical (
          {data.overlays.levels.length + data.overlays.markers.length})
        </summary>
        {eventsOpen && <>
        <p>
          Overlay {chartLabel(data.overlays.status)}
          {data.overlays.reason ? ` · ${chartReason(data.overlays.reason)} (${data.overlays.reason})` : ""}
        </p>
        <ul>
          {data.overlays.levels.map((l) => (
            <li key={l.id}>
              {chartLabel(l.kind)} <code>({l.kind})</code> · {formatChartMoney(l.price)} · {l.starts_at}–
              {l.ends_at ?? "aktif"} · tersedia {l.available_session} ·{" "}
              {chartLabel(l.status)}
            </li>
          ))}
          {data.overlays.markers.map((m) => (
            <li key={m.id}>
              {chartLabel(m.kind)} <code>({m.kind})</code> · {m.session} · {formatChartMoney(m.price)} · {chartLabel(m.status)}
              {m.status === "simulated" ? " — fill simulasi" : ""}
            </li>
          ))}
        </ul>
        {!data.overlays.levels.length && !data.overlays.markers.length && (
          <p>Tidak ada level/event untuk konteks ini.</p>
        )}
        </>}
      </details>
    </>
  );
}
export function ChartPanel({
  request,
  mode,
  load = fetchChart,
  fixture = false,
  initialIndicators = {},
  initiallyOpen = false,
  onClose,
  returnTo,
  overlay = false,
}: Props) {
  const requestKey = JSON.stringify(request);
  const [chosenView, setChosenView] = useState<{ key: string; view: ChartRequest['view'] } | null>(null);
  const activeRequest = chosenView?.key === requestKey ? chartViewRequest(request, chosenView.view) ?? request : request;
  const [open, setOpen] = useState(initiallyOpen),
    [storedData, setData] = useState<ChartData | null>(null),
    [loadedIdentity, setLoadedIdentity] = useState<string | null>(null),
    [errorIdentity, setErrorIdentity] = useState<string | null>(null),
    [storedError, setError] = useState<Extract<
      ChartEnvelope,
      { success: false }
    > | null>(null),
    [busy, setBusy] = useState(false),
    [cooldown, setCooldown] = useState(false),
    [sma10, setSma10] = useState(initialIndicators.sma10 ?? false),
    [ema200, setEma200] = useState(initialIndicators.ema200 ?? false),
    [macd, setMacd] = useState(initialIndicators.macd ?? false),
    [range, setRange] = useState<3 | 6 | 12>(6),
    [reset, setReset] = useState(0);
  const fullPage = (fixture || mode === 'fixture') && load !== fetchChart ? null : chartPageHref(activeRequest, returnTo, {sma10, ema200, macd});
  const controller = useRef<AbortController | null>(null),
    opener = useRef<HTMLButtonElement | null>(null),
    generation = useRef(0),
    book = useRef<ChartData | null>(null),
    cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identity = JSON.stringify({ ...activeRequest, data_mode: mode });
  const requestUrl = chartRequestUrl(activeRequest);
  const wireRequest = useMemo(
    () =>
      parseChartRequest(
        request.ticker,
        new URL(requestUrl, "http://chart.internal").searchParams,
      ),
    [request.ticker, requestUrl],
  );
  const data = loadedIdentity === identity ? storedData : null;
  const error = errorIdentity === identity ? storedError : null;
  const run = useCallback(
    async (cursor?: string) => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;
      const id = ++generation.current;
      setBusy(true);
      setError(null);
      setErrorIdentity(identity);
      if (!wireRequest) {
        setError(
          chartFailure("INVALID_REQUEST", "client") as Extract<
            ChartEnvelope,
            { success: false }
          >,
        );
        setBusy(false);
        return;
      }
      if (!cursor) {
        book.current = null;
        setData(null);
      }
      // Explicit opening starts both resources. Closed panels never reach this path.
      // Handle rejection immediately; valid canonical data remains available on renderer failure.
      const rendererReady = loadChartCanvas().then(() => true, () => false);
      try {
        const raw = await load(wireRequest, cursor, next.signal);
        if (next.signal.aborted || id !== generation.current) return;
        const result = parseChartEnvelope(raw, mode, wireRequest.ticker);
        if (!result) throw Error("contract");
        if (!result.success) {
          setError(result);
          if (chartFailureClearsData(result.error.code)) {
            book.current = null;
            setData(null);
            setLoadedIdentity(null);
          }
          if (result.error.code === "RATE_LIMITED") {
            setCooldown(true);
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => setCooldown(false), 60000);
          }
          return;
        }
        if (
          result.data.context.kind !== wireRequest.context ||
          result.data.context.id !== (wireRequest.context_id ?? null) ||
          result.data.context.view !== wireRequest.view ||
          result.data.pagination.limit !== wireRequest.limit
        )
          throw Error("contract");
        const merged =
          cursor && book.current
            ? mergeChartPages(book.current, result.data)
            : result.data;
        if (!merged) {
          setError(
            chartFailure("REVISION_UNAVAILABLE", "client") as Extract<
              ChartEnvelope,
              { success: false }
            >,
          );
          return;
        }
        book.current = merged;
        setLoadedIdentity(identity);
        setData(merged);
        if (!await rendererReady && !next.signal.aborted && id === generation.current) {
          setError(chartFailure("INTERNAL_ERROR", "renderer") as Extract<ChartEnvelope, { success: false }>);
        }
      } catch (problem) {
        if (next.signal.aborted || id !== generation.current) return;
        setError(
          chartFailure(
            problem instanceof Error && problem.message === "contract"
              ? "CONTRACT_ERROR"
              : "UPSTREAM_ERROR",
            "client",
          ) as Extract<ChartEnvelope, { success: false }>,
        );
      } finally {
        if (id === generation.current && !next.signal.aborted) setBusy(false);
      }
    },
    [identity, load, mode, wireRequest],
  );
  useEffect(() => {
    // Start an external async read after commit. Cleanup cancels it before a
    // context switch or close, including React StrictMode's rehearsal mount.
    const timer = open ? setTimeout(() => void run(), 0) : null;
    return () => {
      if (timer !== null) clearTimeout(timer);
      controller.current?.abort();
    };
  }, [identity, open, run]);
  useEffect(
    () => () => {
      controller.current?.abort();
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    },
    [],
  );
  const rendererFailed = useCallback(() => {
    setErrorIdentity(identity);
    setError(
      chartFailure("INTERNAL_ERROR", "renderer") as Extract<
        ChartEnvelope,
        { success: false }
      >,
    );
  }, [identity]);
  const closeChart = () => {
    controller.current?.abort();
    setOpen(false);
    onClose?.();
    requestAnimationFrame(() => opener.current?.focus());
  };
  return (
    <section
      className={styles.panel}
      aria-label={`Chart ${request.ticker}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open && !overlay) {
          closeChart();
        }
      }}
    >
      <header className={styles.header}>
        <strong>{request.ticker} · Chart harian</strong>
        <span>
          {chartLabel(activeRequest.context)} / {chartLabel(activeRequest.view)}
        </span>
        {(fixture || mode === 'fixture') && (
          <strong className={styles.warning}>
            FIXTURE DEV — DATA SINTETIS
          </strong>
        )}
      </header>
      {!open ? (
        <>
          <p>
            OHLC tersimpan, indikator engine, dan level dari konteks terpilih.
          </p>
          <button ref={opener} type="button" onClick={() => setOpen(true)}>
            Buka chart
          </button>
        </>
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarGroup} role="group" aria-label="Aksi chart">
            {fullPage && <Link prefetch={false} href={fullPage} data-chart-overlay-fullpage={overlay ? "true" : undefined} title="Buka halaman chart terpisah">{overlay ? "Buka halaman penuh" : "Perbesar chart ↗"}</Link>}
            <button type="button" onClick={closeChart}>
              Tutup chart
            </button>
            <button type="button" onClick={() => void run()} disabled={busy || cooldown}>
              Muat ulang
            </button>
            </div>
            {(request.context === 'signal' || request.context === 'paper') && <div className={styles.toolbarGroup} role="group" aria-label="Sumber waktu chart">
              {(['snapshot', 'followup'] as const).map(view => <button key={view} type="button" aria-pressed={activeRequest.view === view} onClick={() => setChosenView({key: requestKey, view})}>{chartLabel(view)}</button>)}
            </div>}
            <div className={styles.toolbarGroup} role="group" aria-label="Rentang chart">
            {([3, 6, 12] as const).map((n) => (
              <button
                type="button"
                key={n}
                aria-pressed={range === n}
                onClick={() => setRange(n)}
              >
                {n === 12 ? "1 tahun" : `${n} bulan`}
              </button>
            ))}
            <button type="button" onClick={() => setReset((n) => n + 1)}>
              Reset zoom
            </button>
            </div>
            <div className={styles.toolbarGroup} role="group" aria-label="Indikator chart">
            {(
              [
                ["SMA10", sma10, setSma10],
                ["EMA200", ema200, setEma200],
                ["MACD", macd, setMacd],
              ] as const
            ).map(([label, checked, set]) => {
              const keys = label === 'SMA10' ? ['sma10'] as const : label === 'EMA200' ? ['ema200'] as const : ['macd', 'macd_signal', 'macd_histogram'] as const;
              const held = keys.map(key => data?.indicators[key]).find(indicator => indicator?.status === 'unavailable');
              return (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={Boolean(held)}
                  title={held?.reason ? chartReason(held.reason) : undefined}
                  onChange={(e) => set(e.target.checked)}
                />
                {label}
              </label>
            ); })}
            </div>
          </div>
          {busy && <p role="status">Memuat data chart…</p>}
          {error && (
            <div role="alert" className={styles.warning}>
              <strong>{failureText(error.error.code)}</strong>
              {error.error.code === 'DATA_UNAVAILABLE' && error.error.message === 'payload_budget_exceeded' && <p>{chartReason('payload_budget_exceeded')}</p>}
              <p>
                Kode {error.error.code} · request {error.error.request_id}
              </p>
              {error.error.code === "UNAUTHENTICATED" ? (
                <Link
                  href={`/login?next=${encodeURIComponent(fullPage ?? '/scanner')}`}
                >
                  Masuk
                </Link>
              ) : (
                error.error.code !== "FORBIDDEN" && (
                  <button
                    type="button"
                    disabled={busy || cooldown}
                    onClick={() => void run()}
                  >
                    Coba lagi
                  </button>
                )
              )}
            </div>
          )}
          {data && (
            <>
              <p className={styles.status}>
                Harga sampai {data.source.last_market_session} · kelengkapan{" "}
                {chartLabel(data.quality.completeness)} · status harga {chartLabel(data.quality.freshness)}{" "}
                ·{" "}
                {data.context.view === "snapshot"
                  ? "Snapshot saat sinyal"
                  : "Perkembangan setelah sinyal / harga terbaru"}
              </p>
              {[...data.quality.reasons, ...data.quality.warnings].length >
                0 && (
                <p className={styles.warning}>
                  {[...data.quality.reasons, ...data.quality.warnings].map(chartReason).join(
                    " · ",
                  )}
                </p>
              )}
              {!data.bars.length ? (
                <p>
                  Belum ada candle valid pada jendela ini. {data.gaps.length}{" "}
                  sesi data tertahan.
                </p>
              ) : (
                error?.error.code !== "INTERNAL_ERROR" && <ChartRenderer
                    data={data}
                    sma10={sma10}
                    ema200={ema200}
                    macd={macd}
                    range={range}
                    reset={reset}
                    onError={rendererFailed}
                  />
              )}
              {Object.entries(data.indicators)
                .filter(([, i]) => i.status === "unavailable" || i.reason)
                .map(([key, i]) => (
                  <p className={styles.caption} key={key}>
                    {key}: {i.reason ? chartReason(i.reason) : chartLabel(i.status)}
                  </p>
                ))}
              <div className={styles.toolbar}>
                {data.pagination.has_more && (
                  <button
                    disabled={busy || cooldown || data.overlays.has_more}
                    title={
                      data.overlays.has_more
                        ? "Selesaikan halaman event terlebih dahulu."
                        : undefined
                    }
                    type="button"
                    onClick={() => void run(data.pagination.next_cursor!)}
                  >
                    Histori lebih lama
                  </button>
                )}
                {data.overlays.has_more && (
                  <button
                    disabled={busy || cooldown}
                    type="button"
                    onClick={() => void run(data.overlays.next_cursor!)}
                  >
                    Event berikutnya
                  </button>
                )}
              </div>
              <ChartDetails data={data} />
            </>
          )}
        </>
      )}
      <p className={styles.caption}>
        Renderer{" "}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TradingView Lightweight Charts™
        </a>{" "}
        · <a href="/chart-library-NOTICE.txt">Notice</a> ·{" "}
        <a href="/chart-library-LICENSE.txt">License</a>. Harga bersumber dari
        backend aplikasi.
      </p>
    </section>
  );
}
