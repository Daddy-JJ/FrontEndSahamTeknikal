import { parseChartRequest, type ChartRequest } from './chart-contract.ts';
import { chartRequestUrl } from './chart-render.ts';

/** Only return to known read-only app pages; never use arbitrary browser history. */
export function safeChartReturn(value?: string | null): string | null {
  if (value == null) return '/scanner';
  if (value.length > 4096 || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.includes('..') || decoded.startsWith('//')) return null;
    const url = new URL(value, 'https://chart.internal');
    if (url.origin !== 'https://chart.internal' || url.hash) return null;
    const allowed = /^(?:\/|\/scanner|\/analytics|\/journal|\/journal\/paper\/[A-Za-z0-9_-]{1,256}|\/journal\/[0-9a-f-]{36})$/;
    return allowed.test(url.pathname) ? value : null;
  } catch { return null; }
}
type IndicatorChoice = {sma10?: boolean; ema200?: boolean; macd?: boolean};
export function chartPageHref(request: ChartRequest, returnTo?: string, indicators: IndicatorChoice = {}): string | null {
  const url = new URL(chartRequestUrl(request), 'https://chart.internal');
  if (!parseChartRequest(request.ticker, url.searchParams)) return null;
  const back = safeChartReturn(returnTo);
  if (!back) return null;
  url.searchParams.set('return_to', back);
  const selected = (['sma10', 'ema200', 'macd'] as const).filter(key => indicators[key]);
  if (selected.length) url.searchParams.set('indicators', selected.join(','));
  return `/chart/${encodeURIComponent(request.ticker)}?${url.searchParams.toString()}`;
}
export function chartPageRequest(ticker: string, query: URLSearchParams): {request: ChartRequest; returnTo: string; initialIndicators: IndicatorChoice} | null {
  if (query.getAll('return_to').length > 1 || query.getAll('indicators').length > 1) return null;
  const returnTo = safeChartReturn(query.get('return_to'));
  const wire = new URLSearchParams(query);
  wire.delete('return_to');
  const values = query.has('indicators') ? query.get('indicators')!.split(',') : [];
  if (values.some(value => !['sma10', 'ema200', 'macd'].includes(value)) || new Set(values).size !== values.length) return null;
  const initialIndicators: IndicatorChoice = Object.fromEntries(values.map(value => [value, true]));
  wire.delete('indicators');
  const request = parseChartRequest(ticker, wire);
  return request && returnTo ? { request, returnTo, initialIndicators } : null;
}
export function chartViewRequest(request: ChartRequest, view: ChartRequest['view']): ChartRequest | null {
  if (view === 'snapshot' && (request.context === 'actual' || request.context === 'latest')) return null;
  // A new view requires a new bounded source window, never an old page cursor.
  const { from: _from, to: _to, cursor: _cursor, ...base } = request;
  void _from; void _to; void _cursor;
  return { ...base, view };
}
export function chartIndicators(strategy?: string | null, exitFamily?: string | null): {sma10?: boolean; ema200?: boolean; macd?: boolean} {
  const macd = strategy === 'MACD_EMA200_V1' || strategy === 'MACD + EMA200';
  const sma10 = exitFamily === 'ma10' || exitFamily === 'SMA10';
  return { ...(macd ? { ema200: true, macd: true } : {}), ...(sma10 ? { sma10: true } : {}) };
}
