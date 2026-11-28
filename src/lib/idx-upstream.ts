/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UpstreamFetchResult<T> {
  ok: boolean;
  data: T | null;
  fetchedAt: string | null;
  staleFromCache: boolean;
  error?: string;
}

const DEFAULT_BASE = "https://idx.maxlong.my.id";
const GRACE_WINDOW_MS = 30 * 60 * 1000;

const RESPONSE_CACHE = new Map<
  string,
  { expiresAt: number; graceUntil: number; fetchedAt: string; data: unknown }
>();

function getUpstreamBase(): string {
  return (process.env.IDX_TERMINAL_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

/**
 * Reset in-memory upstream cache (used by unit tests).
 */
export function clearUpstreamCache(): void {
  RESPONSE_CACHE.clear();
}

/**
 * Perform a bounded-timeout GET against the upstream IDX terminal API with short TTL + stale grace caching.
 */
export async function fetchUpstreamJson<T = Record<string, any>>(
  path: string,
  options: { ttlMs?: number; timeoutMs?: number; bypassCache?: boolean } = {}
): Promise<UpstreamFetchResult<T>> {
  const ttlMs = options.ttlMs ?? 120_000;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getUpstreamBase()}${normalizedPath}`;
  const now = Date.now();

  const cached = RESPONSE_CACHE.get(url);
  if (!options.bypassCache && cached && cached.expiresAt > now) {
    return {
      ok: true,
      data: cached.data as T,
      fetchedAt: cached.fetchedAt,
      staleFromCache: false,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "SahamTeknikal-BFF/1.0",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Upstream HTTP ${res.status}`);
    }

    const parsed = (await res.json()) as T & { status?: string };
    const fetchedAt = new Date().toISOString();
    RESPONSE_CACHE.set(url, {
      expiresAt: now + ttlMs,
      graceUntil: now + Math.max(ttlMs, GRACE_WINDOW_MS),
      fetchedAt,
      data: parsed,
    });

    return {
      ok: true,
      data: parsed,
      fetchedAt,
      staleFromCache: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (cached && cached.graceUntil > now) {
      return {
        ok: true,
        data: cached.data as T,
        fetchedAt: cached.fetchedAt,
        staleFromCache: true,
        error: msg,
      };
    }
    return {
      ok: false,
      data: null,
      fetchedAt: null,
      staleFromCache: false,
      error: msg,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCorpActionsUpstream(params: {
  ticker?: string;
  upcomingOnly?: boolean;
  limit?: number;
} = {}): Promise<UpstreamFetchResult<Record<string, any>>> {
  const sp = new URLSearchParams();
  sp.set("upcoming", params.upcomingOnly === false ? "0" : "1");
  sp.set("limit", String(params.limit ?? 600));
  if (params.ticker) sp.set("ticker", params.ticker.toUpperCase());
  return fetchUpstreamJson(`/api/calendar/corpactions?${sp.toString()}`, {
    ttlMs: 180_000,
    timeoutMs: 8_500,
  });
}

export async function fetchTickerIntelUpstream(
  ticker: string
): Promise<UpstreamFetchResult<Record<string, any>>> {
  const code = encodeURIComponent(ticker.toUpperCase());
  return fetchUpstreamJson(`/api/ticker/${code}/intelligence`, {
    ttlMs: 120_000,
    timeoutMs: 8_500,
  });
}

export async function fetchTickerAccumZonesUpstream(
  ticker: string
): Promise<UpstreamFetchResult<Record<string, any>>> {
  const code = encodeURIComponent(ticker.toUpperCase());
  return fetchUpstreamJson(`/api/accumulation-zones/${code}`, {
    ttlMs: 120_000,
    timeoutMs: 7_500,
  });
}

export async function fetchTickerBrokerSummaryUpstream(
  ticker: string
): Promise<UpstreamFetchResult<Record<string, any>>> {
  const code = encodeURIComponent(ticker.toUpperCase());
  return fetchUpstreamJson(`/api/broker-intel/ticker/${code}/summary`, {
    ttlMs: 120_000,
    timeoutMs: 8_500,
  });
}

export async function fetchTickerOwnershipUpstream(
  ticker: string
): Promise<UpstreamFetchResult<Record<string, any>>> {
  const code = encodeURIComponent(ticker.toUpperCase());
  return fetchUpstreamJson(`/api/ownership/${code}/parsed`, {
    ttlMs: 300_000,
    timeoutMs: 7_500,
  });
}

export async function fetchTickerNewsUpstream(
  ticker: string
): Promise<UpstreamFetchResult<Record<string, any>>> {
  const code = encodeURIComponent(ticker.toUpperCase());
  return fetchUpstreamJson(`/api/news/${code}`, {
    ttlMs: 180_000,
    timeoutMs: 7_000,
  });
}
