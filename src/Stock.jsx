import { useEffect, useState } from "react";
import { useMarket } from "./useMarket.js";
import { AnimatedNumber, Backdrop, Ticker } from "./ui.jsx";
import "./Stock.css";

const fmt = (n) => n.toLocaleString("ko-KR");
const pct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
const dirOf = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");
const arrow = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "–");

function Chart({ rows }) {
  const [hover, setHover] = useState(null);
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
            {fmt(h.close)}원 ({arrow(hp)} {fmt(Math.abs(hp))})
          </span>
          <small>거래량 {fmt(h.volume)}</small>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className={tone}>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export default function Stock({ code, name, market }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const { data: live } = useMarket();

  useEffect(() => {
    document.title = `${name} — 마켓노트`;
  }, [name]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/history/${code}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setRows(j.data))
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => ctrl.abort();
  }, [code]);

  const shell = (children) => (
    <>
      <Backdrop />
      <div className="page">
        <Ticker stocks={live?.stocks} />
        {children}
      </div>
    </>
  );

  if (error) return shell(<p className="sec-msg">불러오기 실패: {error}</p>);
  if (!rows) return shell(<p className="sec-msg">불러오는 중…</p>);

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const diff = prev ? last.close - prev.close : 0;
  const rate = prev ? (diff / prev.close) * 100 : 0;
  const first = rows[0];
  const periodRate = ((last.close - first.close) / first.close) * 100;
  const hi = rows.reduce((a, r) => (r.high > a.high ? r : a));
  const lo = rows.reduce((a, r) => (r.low < a.low ? r : a));
  const avgVol = Math.round(
    rows.reduce((s, r) => s + r.volume, 0) / rows.length,
  );

  return shell(
    <main className="sec">
      <a className="back-link" href="/">
        ← 목록으로
      </a>
      <header className="sec-head">
        <div>
          <h1>{name}</h1>
          <span className="badge">
            {code} · {market}
          </span>
        </div>
        <div className={`sec-price ${dirOf(diff)}`}>
          <strong>
            <AnimatedNumber value={last.close} />
            <em>원</em>
          </strong>
          <span>
            {arrow(diff)} {fmt(Math.abs(diff))} ({pct(rate)})
          </span>
          <small>{last.date} 종가 기준</small>
        </div>
      </header>

      <section className="stats">
        <Stat
          label="30일 수익률"
          value={pct(periodRate)}
          tone={dirOf(periodRate)}
          sub={`${first.date} 대비`}
        />
        <Stat label="30일 최고가" value={fmt(hi.high)} sub={hi.date} />
        <Stat label="30일 최저가" value={fmt(lo.low)} sub={lo.date} />
        <Stat label="평균 거래량" value={fmt(avgVol)} sub="일평균" />
      </section>

      <section className="card">
        <h2>종가 추이</h2>
        <Chart rows={rows} />
      </section>

      <section className="card">
        <h2>일별 시세</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>종가</th>
                <th>전일비</th>
                <th>등락률</th>
                <th>시가</th>
                <th>고가</th>
                <th>저가</th>
                <th>거래량</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r, i, arr) => {
                const p = arr[i + 1];
                const d = p ? r.close - p.close : 0;
                const dr = p ? (d / p.close) * 100 : 0;
                const c = dirOf(d);
                return (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td className={c}>
                      <b>{fmt(r.close)}</b>
                    </td>
                    <td className={c}>
                      {p ? `${arrow(d)} ${fmt(Math.abs(d))}` : "-"}
                    </td>
                    <td className={c}>{p ? pct(dr) : "-"}</td>
                    <td>{fmt(r.open)}</td>
                    <td>{fmt(r.high)}</td>
                    <td>{fmt(r.low)}</td>
                    <td>{fmt(r.volume)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>,
  );
}
