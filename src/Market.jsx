import { useEffect, useRef, useState } from "react";
import { slugOf } from "./stocks.js";
import { useMarket } from "./useMarket.js";
import { AnimatedNumber, Backdrop, Ticker } from "./ui.jsx";
import "./Market.css";

const number = new Intl.NumberFormat("ko-KR");
const decimal = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const FAVORITES_KEY = "marketnote-favorites";

const direction = (v) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
const signed = (v, dec = false) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${(dec ? decimal : number).format(Math.abs(v))}`;
const val = (v) => (v == null ? "—" : number.format(v));
const fmtInt = (n) => number.format(Math.round(n));
const fmtDec = (n) => decimal.format(n);
const fmtRate = (n) => `${signed(n, true)}%`;

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (Array.isArray(saved)) return new Set(saved);
  } catch {
    /* 저장소를 사용할 수 없으면 현재 화면에서만 유지합니다. */
  }
  return new Set();
}

function IndexCard({ item }) {
  const dir = direction(item.change);
  const kospi = item.code === "KOSPI";
  return (
    <article className={`index-card glass ${dir}-glow`}>
      <div className="index-top">
        <span className="index-symbol">{kospi ? "K" : "Q"}</span>
        <div>
          <strong>{item.code}</strong>
          <small>{kospi ? "코스피 지수" : "코스닥 지수"}</small>
        </div>
        <span className={`index-arrow ${dir}`}>
          {item.change < 0 ? "↘" : item.change > 0 ? "↗" : "→"}
        </span>
      </div>
      <div className="index-bottom">
        <strong>
          <AnimatedNumber value={item.price} format={fmtDec} />
        </strong>
        <span className={`index-change ${dir}`}>
          {signed(item.change, true)} <b>{signed(item.rate, true)}%</b>
        </span>
      </div>
      <div className="index-caption">
        전일 대비 <span>INDEX / KR</span>
      </div>
    </article>
  );
}

function BreadthCard({ stocks }) {
  const up = stocks.filter((x) => x.change > 0).length;
  const down = stocks.filter((x) => x.change < 0).length;
  const flat = stocks.length - up - down;
  const w = (n) => `${(n / stocks.length) * 100}%`;
  return (
    <article className="breadth-card glass">
      <div className="breadth-top">
        <span>WATCHLIST PULSE</span>
        <span>✳</span>
      </div>
      <strong>오늘의 종목 온도</strong>
      <p>대표 종목 {stocks.length}개 기준</p>
      <div
        className="breadth-bar"
        aria-label={`상승 ${up}, 보합 ${flat}, 하락 ${down}`}
      >
        <span style={{ width: w(up) }} />
        <span style={{ width: w(flat) }} />
        <span style={{ width: w(down) }} />
      </div>
      <div className="breadth-legend">
        <span>
          상승 <b className="up">{up}</b>
        </span>
        <span>
          보합 <b>{flat}</b>
        </span>
        <span>
          하락 <b className="down">{down}</b>
        </span>
      </div>
    </article>
  );
}

function StockRow({ item, favorite, onFavorite, onDetail }) {
  return (
    <tr>
      <td>
        <button
          className={`star ${favorite ? "selected" : ""}`}
          onClick={() => onFavorite(item.code)}
          aria-label={`${item.name} 관심 종목 ${favorite ? "해제" : "추가"}`}
          aria-pressed={favorite}
        >
          {favorite ? "★" : "☆"}
        </button>
      </td>
      <td>
        <button className="stock-button" onClick={() => onDetail(item.code)}>
          <span className="stock-avatar">{item.name.slice(0, 1)}</span>
          <span>
            <strong>{item.name}</strong>
            <small>
              {item.code} <i>·</i> {item.market}
            </small>
          </span>
        </button>
      </td>
      <td className="price">
        <AnimatedNumber value={item.price} format={fmtInt} /> <small>원</small>
      </td>
      <td className={direction(item.change)}>{signed(item.change)}</td>
      <td>
        <span className={`rate ${direction(item.rate)}`}>
          <AnimatedNumber value={item.rate} format={fmtRate} />
        </span>
      </td>
      <td>{val(item.volume)}</td>
      <td>
        <button
          className="row-arrow"
          onClick={() => onDetail(item.code)}
          aria-label={`${item.name} 상세 보기`}
        >
          ↗
        </button>
      </td>
    </tr>
  );
}

function Detail({ item, favorite, onFavorite }) {
  const hasRange = item.low != null && item.high != null && item.high > item.low;
  const position = hasRange
    ? Math.max(0, Math.min(100, ((item.price - item.low) / (item.high - item.low)) * 100))
    : 50;
  return (
    <>
      <div className="detail-title">
        <div>
          <span>
            {item.market} · {item.code}
          </span>
          <h3 id="detail-name">{item.name}</h3>
        </div>
        <button
          className={`detail-star ${favorite ? "selected" : ""}`}
          onClick={() => onFavorite(item.code)}
          aria-pressed={favorite}
          aria-label={`관심 종목 ${favorite ? "해제" : "추가"}`}
        >
          {favorite ? "★" : "☆"}
        </button>
      </div>
      <div className="detail-price">
        <AnimatedNumber value={item.price} format={fmtInt} />
        <small>원</small>
      </div>
      <div className={`detail-change ${direction(item.change)}`}>
        {signed(item.change)}원 <span>{signed(item.rate, true)}%</span>{" "}
        <small>전일 대비</small>
      </div>
      <div className="range-box">
        <div className="range-title">
          오늘의 가격 범위 <span>DAY RANGE</span>
        </div>
        <div className="range-track">
          <i style={{ left: `${position}%` }} />
        </div>
        <div className="range-labels">
          <span>
            저가 <b>{val(item.low)}</b>
          </span>
          <span>
            고가 <b>{val(item.high)}</b>
          </span>
        </div>
        {!hasRange && <p className="range-unavailable">가격 범위 정보가 없습니다.</p>}
      </div>
      <div className="detail-grid">
        <div>
          <span>전일 종가</span>
          <b>{val(item.previous)}</b>
        </div>
        <div>
          <span>시가</span>
          <b>{val(item.open)}</b>
        </div>
        <div>
          <span>거래량</span>
          <b>{val(item.volume)}</b>
        </div>
        <div>
          <span>시장</span>
          <b>{item.market}</b>
        </div>
      </div>
      {slugOf(item.code) && (
        <a className="detail-link detail-more" href={`/${slugOf(item.code)}`}>
          자세히 보기 <span>→</span>
        </a>
      )}
      <a
        className="detail-link"
        href={`https://finance.naver.com/item/main.naver?code=${encodeURIComponent(item.code)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        네이버 증권에서 자세히 보기 <span>↗</span>
      </a>
      <p className="detail-foot">네이버 증권 제공 · 시세는 지연될 수 있습니다.</p>
    </>
  );
}

export default function Market() {
  const { data, failed, loading, refresh } = useMarket();
  const [market, setMarket] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [favorites, setFavorites] = useState(loadFavorites);
  const [selectedCode, setSelectedCode] = useState(null);
  const dialogRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    document.title = "마켓노트 — 내 손안의 마켓 보드";
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedCode && dialog && !dialog.open) dialog.showModal();
  }, [selectedCode]);

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
        !dialogRef.current?.open
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleFavorite = (code) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {
        /* 브라우저 저장소가 차단된 경우 */
      }
      return next;
    });
  };

  const stocks = data?.stocks ?? [];
  const q = query.trim().toLowerCase();
  const items = stocks.filter(
    (x) =>
      (market === "all" ||
        (market === "favorites" ? favorites.has(x.code) : x.market === market)) &&
      (x.name.toLowerCase().includes(q) || x.code.includes(q)),
  );
  if (sort === "up") items.sort((a, b) => b.rate - a.rate);
  if (sort === "down") items.sort((a, b) => a.rate - b.rate);
  if (sort === "volume") items.sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const date = data?.source_time == null ? null : new Date(data.source_time);
  const updated = !data
    ? "시세를 불러오는 중"
    : !date || Number.isNaN(date.valueOf())
      ? "시세 확인 완료"
      : `${timeFormat.format(date)} 기준`;
  const selected = stocks.find((x) => x.code === selectedCode);

  const tabs = [
    ["all", "전체", <span key="c">{data ? stocks.length : "—"}</span>],
    ["KOSPI", "코스피"],
    ["KOSDAQ", "코스닥"],
    ["favorites", "★ 관심", <span key="f">{favorites.size}</span>],
  ];

  return (
    <>
      <Backdrop />
      <div className="page">
        <Ticker stocks={data?.stocks} />
        <header className="topbar">
          <div className="shell nav">
            <a className="brand" href="/" aria-label="마켓노트 홈">
              <span className="logo">
                m<span>.</span>
              </span>
              <span>
                marketnote<small>MARKET BOARD</small>
              </span>
            </a>
            <div className="nav-right">
              <span className="source">
                <i /> NAVER FINANCE · LIVE
              </span>
              <a href="#watchlist" className="nav-link">
                종목 둘러보기 <span>↗</span>
              </a>
            </div>
          </div>
        </header>
        <main className="shell">
          <section className="hero glass">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" /> YOUR MARKET, AT A GLANCE
              </div>
              <h1>
                오늘의 시장을
                <br />
                <span>내 방식대로.</span>
              </h1>
              <p>
                흩어진 숫자 대신, 궁금한 흐름부터.
                <br />
                나만의 관심 종목을 담아 시장을 살펴보세요.
              </p>
              <a href="#watchlist" className="hero-button">
                종목 살펴보기 <span>↘</span>
              </a>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="art-card">
                <span>MARKET SNAPSHOT</span>
                <strong>
                  Make sense
                  <br />
                  of the market<span>.</span>
                </strong>
                <div className="art-bars">
                  {Array.from({ length: 9 }, (_, i) => (
                    <i key={i} style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
                <small>THE BIG PICTURE, MADE SIMPLE</small>
              </div>
              <div className="art-tag">
                <span>✦</span> A LITTLE MORE CLARITY
              </div>
            </div>
            <div className="hero-bottom">
              <span>01 / THE DAILY OVERVIEW</span>
              <span>SCROLL TO EXPLORE ↓</span>
            </div>
          </section>

          <section className="overview" aria-labelledby="market-title">
            <div className="section-head">
              <div>
                <div className="kicker">
                  <span>01</span> MARKET PULSE
                </div>
                <h2 id="market-title">
                  오늘의 시장 <span>어디로 움직이고 있을까요?</span>
                </h2>
              </div>
              <div className="update">
                <span className="live-dot" />
                <span>{updated}</span>
                <button
                  className={`refresh ${loading ? "spinning" : ""}`}
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                  aria-label="시세 새로고침"
                  title="시세 새로고침"
                >
                  ↻
                </button>
              </div>
            </div>
            <div className="indices">
              {data ? (
                <>
                  {data.indices.map((item) => (
                    <IndexCard key={item.code} item={item} />
                  ))}
                  <BreadthCard stocks={stocks} />
                </>
              ) : (
                <div className="index-card glass loading">
                  {failed
                    ? "시장 지수를 불러오지 못했습니다."
                    : "시장 지수를 불러오고 있습니다."}
                </div>
              )}
            </div>
          </section>

          <section className="watchlist" id="watchlist" aria-labelledby="stocks-title">
            <div className="section-head stock-head">
              <div>
                <div className="kicker">
                  <span>02</span> YOUR WATCHLIST
                </div>
                <h2 id="stocks-title">
                  종목 탐색 <span>관심 가는 종목을 골라보세요.</span>
                </h2>
              </div>
              <div className="search-wrap glass">
                <span aria-hidden="true">⌕</span>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="종목명 또는 코드 검색"
                  aria-label="종목명 또는 종목코드 검색"
                />
                <kbd>/</kbd>
              </div>
            </div>
            <div className="table-panel glass">
              <div className="table-top">
                <div className="tabs" role="group" aria-label="시장 필터">
                  {tabs.map(([key, label, extra]) => (
                    <button
                      key={key}
                      className={`tab ${key === "favorites" ? "favorite-tab" : ""} ${market === key ? "active" : ""}`}
                      aria-pressed={market === key}
                      onClick={() => setMarket(key)}
                    >
                      {label} {extra}
                    </button>
                  ))}
                </div>
                <label className="sort-label">
                  정렬{" "}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="종목 정렬"
                  >
                    <option value="default">기본순</option>
                    <option value="up">상승률 높은순</option>
                    <option value="down">하락률 높은순</option>
                    <option value="volume">거래량 많은순</option>
                    <option value="name">이름순</option>
                  </select>
                </label>
              </div>
              {failed && (
                <div className="status" role="status">
                  {data
                    ? "시세 갱신에 실패했습니다. 마지막으로 가져온 데이터를 표시합니다."
                    : "시세를 불러오지 못했습니다. 잠시 후 새로고침해 주세요."}
                </div>
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>관심</th>
                      <th>종목명</th>
                      <th>현재가</th>
                      <th>전일 대비</th>
                      <th>등락률</th>
                      <th>거래량</th>
                      <th>
                        <span className="sr-only">상세</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data ? (
                      <tr>
                        <td colSpan="7" className="empty">
                          {failed ? "시세를 불러오지 못했습니다." : "시세를 불러오고 있습니다."}
                        </td>
                      </tr>
                    ) : items.length ? (
                      items.map((item) => (
                        <StockRow
                          key={item.code}
                          item={item}
                          favorite={favorites.has(item.code)}
                          onFavorite={toggleFavorite}
                          onDetail={setSelectedCode}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty">
                          <span>✳</span>
                          {market === "favorites" && !favorites.size && !q
                            ? "관심 종목이 아직 없어요. 별을 눌러 담아보세요."
                            : "검색 결과가 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  <i /> 종목을 선택하면 자세한 시세를 볼 수 있어요.
                </span>
                <span>대표 종목 기준 · 시세는 지연될 수 있습니다.</span>
              </div>
            </div>
          </section>

          <section className="endnote glass">
            <div>
              <span>MAKE THE MARKET YOURS</span>
              <strong>한 걸음 더 가까워진 시장.</strong>
            </div>
            <a href="https://finance.naver.com/" target="_blank" rel="noopener noreferrer">
              네이버 증권에서 더 보기 ↗
            </a>
          </section>
          <footer>
            <a className="footer-brand" href="/">
              m<span>.</span> marketnote
            </a>
            <p>네이버 증권 제공 시세 · 투자 참고용 정보입니다.</p>
            <span>© MARKETNOTE</span>
          </footer>
        </main>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="detail-name"
        onClose={() => setSelectedCode(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        <div className="dialog-head">
          <span>
            STOCK DETAILS <i>✳</i>
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="상세창 닫기"
          >
            ×
          </button>
        </div>
        {selected && (
          <Detail
            item={selected}
            favorite={favorites.has(selected.code)}
            onFavorite={toggleFavorite}
          />
        )}
      </dialog>
    </>
  );
}
