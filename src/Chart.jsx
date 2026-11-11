import { useState } from "react";
import { fmt, dirOf, arrow } from "./format.js";
import "./Chart.css";

export default function Chart({ rows, unit = "원", digits = 0 }) {
  const [hover, setHover] = useState(null);
  const fmtD = (n) =>
    n.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const W = 800,
    H = 260,
    VH = 60,
    PX = 12,
    PR = 72, // 오른쪽 y축 숫자 영역
    PT = 16,
    PB = 8;
  const n = rows.length;
  const closes = rows.map((r) => r.close);
  const min = Math.min(...closes),
    max = Math.max(...closes);
  // y축 눈금 간격: 가격대에 맞춰 눈금이 5개 안팎이 되도록 1·2·5 단위로 정합니다.
  const raw = Math.max(max - min, 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const STEP = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const lo = Math.floor(min / STEP) * STEP;
  const hi = Math.max(Math.ceil(max / STEP) * STEP, lo + STEP);
  const ticks = Array.from(
    { length: (hi - lo) / STEP + 1 },
    (_, k) => lo + k * STEP,
  );
  const maxVol = Math.max(...rows.map((r) => r.volume));
  const x = (i) => PX + (i * (W - PX - PR)) / (n - 1);
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const line = rows.map((r, i) => `${x(i)},${y(r.close)}`).join(" ");
  const area = `${x(0)},${H} ${line} ${x(n - 1)},${H}`;
  const barW = ((W - PX - PR) / n) * 0.6;
  const up = closes[n - 1] >= closes[0];

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PX) / (W - PX - PR)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const h = hover != null ? rows[hover] : null;
  const hp = hover != null && hover > 0 ? h.close - rows[hover - 1].close : 0;

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H + VH}`}
        className={`chart ${up ? "up" : "down"}`}
        role="img"
        aria-label="종가 및 거래량 추이"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => {
          const gy = y(v);
          return (
            <g key={v}>
              <line x1={PX} x2={W - PR} y1={gy} y2={gy} className="grid" />
              <text x={W - PR + 8} y={gy + 4} className="axis">
                {fmt(v)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#fill)" />
        <polyline
          points={line}
          pathLength="1"
          className="draw"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {rows.map((r, i) => {
          const bh = (r.volume / maxVol) * (VH - 10);
          const d = i > 0 ? r.close - rows[i - 1].close : 0;
          return (
            <rect
              key={r.date}
              x={x(i) - barW / 2}
              y={H + VH - bh}
              width={barW}
              height={bh}
              className={`vol ${dirOf(d)}`}
              opacity={hover === i ? 1 : 0.45}
            />
          );
        })}
        {h && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PT}
              y2={H + VH}
              className="cross"
            />
            <circle
              cx={x(hover)}
              cy={y(h.close)}
              r="5"
              fill="currentColor"
              stroke="#0a0c1f"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      {h && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{h.date}</b>
          <span className={dirOf(hp)}>
            {fmtD(h.close)}{unit} ({arrow(hp)} {fmtD(Math.abs(hp))})
          </span>
          <small>거래량 {fmt(h.volume)}</small>
        </div>
      )}
    </div>
  );
}

