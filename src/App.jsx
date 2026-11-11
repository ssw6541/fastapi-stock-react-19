import { lazy, Suspense } from "react";

// 각 화면의 CSS가 서로 섞이지 않도록 경로별로 지연 로딩합니다.
const Market = lazy(() => import("./Market.jsx"));
const Stock = lazy(() => import("./Stock.jsx"));

// 종목 추가는 여기에 한 줄만 추가하면 됩니다.
const STOCKS = {
  "/samsung": { code: "005930", name: "삼성전자", market: "KOSPI" },
  // "/skhynix": { code: "000660", name: "SK하이닉스", market: "KOSPI" },
};

function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  const stock = STOCKS[path];
  let page = null;
  if (path === "") page = <Market />;
  else if (stock) page = <Stock key={stock.code} {...stock} />;
  return <Suspense fallback={null}>{page}</Suspense>;
}

export default App;
