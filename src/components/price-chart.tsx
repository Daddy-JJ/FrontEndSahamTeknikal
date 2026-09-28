import { useId } from "react";
import type { ChartBar } from "@/lib/types";
import { fmt } from "@/lib/types";

export function Sparkline({ bars }: { bars: ChartBar[] }) {
  const id = useId();
  const values = bars.slice(-24).map(b => b.close);
  const min = Math.min(...values), span = Math.max(...values) - min || 1;
  const points = values.map((c, i) => `${i * 160 / Math.max(values.length - 1, 1)},${42 - (c - min) / span * 35}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 160 48" role="img" aria-label="Tren harga sintetis 24 sesi">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".15" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    <polygon points={`0,48 ${points} 160,48`} fill={`url(#${id})`} />
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>;
}

export function PriceChart({ bars, ticker }: { bars: ChartBar[]; ticker: string }) {
  const min = Math.min(...bars.map(b => Math.min(b.low, b.ema20)))*.995;
  const max = Math.max(...bars.map(b => Math.max(b.high, b.ema20)))*1.005;
  const y = (price: number) => 190 - (price - min)/(max - min || 1)*160;
  const x = (i: number) => 16+i*620/Math.max(bars.length-1,1);
  const volumeMax = Math.max(...bars.map(b => b.volume));
  return <div className="chart-wrap"><svg viewBox="0 0 710 270" role="img" aria-label={`Candlestick sintetis ${ticker}, EMA20 dan volume`}>
    {[0,1,2,3,4].map(i => { const price = min + (max-min)*i/4; return <g key={i}>
      <line x1="8" x2="643" y1={y(price)} y2={y(price)} className="chart-grid" />
      <text x="654" y={y(price)+4} className="chart-label">{fmt(price)}</text>
    </g>; })}
    {bars.map((b,i) => <g key={b.session} className={b.close >= b.open ? "candle-up" : "candle-down"}>
      <title>{`${b.session} · O ${fmt(b.open,2)} · H ${fmt(b.high,2)} · L ${fmt(b.low,2)} · C ${fmt(b.close,2)}`}</title>
      <line x1={x(i)} x2={x(i)} y1={y(b.high)} y2={y(b.low)} stroke="currentColor" />
      <rect x={x(i)-2.5} y={Math.min(y(b.open), y(b.close))} width="5" height={Math.max(Math.abs(y(b.close)-y(b.open)),1)} fill="currentColor" />
      <rect x={x(i)-2.5} y={234-b.volume/volumeMax*22} width="5" height={b.volume/volumeMax*22} fill="currentColor" opacity=".28" />
    </g>)}
    <polyline points={bars.map((b,i) => `${x(i)},${y(b.ema20)}`).join(" ")} stroke="#b69a63" strokeWidth="1.5" fill="none" />
    {[0, Math.floor(bars.length/2), bars.length-1].map(i => <text key={i} x={x(i)} y="259" textAnchor={i===0 ? "start" : i===bars.length-1 ? "end" : "middle"} className="chart-label">{bars[i].session}</text>)}
  </svg></div>;
}
