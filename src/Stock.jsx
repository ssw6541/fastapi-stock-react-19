import { useEffect, useState } from "react";
import { useMarket } from "./useMarket.js";
import { AnimatedNumber, Backdrop, Ticker } from "./ui.jsx";
import Chart from "./Chart.jsx";
import { fmt, pct, dirOf, arrow } from "./format.js";
import "./Stock.css";

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
