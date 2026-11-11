import { useEffect, useRef, useState } from "react";
import { slugOf } from "./stocks.js";

const defaultFormat = (n) => Math.round(n).toLocaleString("ko-KR");

// 값이 바뀌면 숫자가 굴러가듯 변하고, 오르면 붉게·내리면 푸르게 번쩍입니다.
export function AnimatedNumber({ value, format = defaultFormat, duration = 800 }) {
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(value);
  const [flash, setFlash] = useState({ dir: "", n: 0 });
  const shownRef = useRef(value);

  if (value !== prev) {
    setPrev(value);
    setFlash((f) => ({ dir: value > prev ? "up" : "down", n: f.n + 1 }));
  }

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      shownRef.current = from + (value - from) * eased;
      setShown(shownRef.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span key={flash.n} className={`num ${flash.dir ? `flash-${flash.dir}` : ""}`}>
      {format(shown)}
    </span>
  );
}

// 배경 그리드·글로우, 마우스를 따라다니는 빛
export function Backdrop() {
  const cursor = useRef(null);
  useEffect(() => {
    const onMove = (e) => {
      if (cursor.current)
        cursor.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div className="fx" aria-hidden="true">
      <div className="fx-grid" />
      <div className="fx-orb a" />
      <div className="fx-orb b" />
      <div className="fx-orb c" />
      <div className="fx-cursor" ref={cursor} />
    </div>
  );
}

const sign = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "–");
const dir = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");

// 흐르는 시세 티커 (끊김 없이 이어지도록 목록을 두 번 이어 붙입니다)
export function Ticker({ stocks }) {
  if (!stocks?.length)
    return (
      <div className="ticker">
        <div className="tick-empty">LIVE FEED 연결 중…</div>
      </div>
    );
  const items = [...stocks, ...stocks];
  return (
    <div className="ticker" role="marquee" aria-label="실시간 시세">
      <div className="ticker-track">
        {items.map((s, i) => {
          const slug = slugOf(s.code);
          const body = (
            <>
              <b>{s.name}</b>
              <span className="num">{Math.round(s.price).toLocaleString("ko-KR")}</span>
              <span className={dir(s.rate)}>
                {sign(s.rate)} {Math.abs(s.rate).toFixed(2)}%
              </span>
            </>
          );
          return slug ? (
            <a key={i} className="tick" href={`/${slug}`} aria-hidden={i >= stocks.length}>
              {body}
            </a>
          ) : (
            <span key={i} className="tick" aria-hidden={i >= stocks.length}>
              {body}
            </span>
          );
        })}
      </div>
    </div>
  );
}
