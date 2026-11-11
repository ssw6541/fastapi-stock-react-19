import { lazy, Suspense } from "react";
import { STOCKS } from "./stocks.js";

// 각 화면의 CSS가 서로 섞이지 않도록 경로별로 지연 로딩합니다.
const Market = lazy(() => import("./Market.jsx"));
const Stock = lazy(() => import("./Stock.jsx"));

function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  const stock = Object.hasOwn(STOCKS, path.slice(1)) ? STOCKS[path.slice(1)] : null;
  let page = null;
  if (path === "") page = <Market />;
  else if (stock) page = <Stock key={stock.code} {...stock} />;
  return <Suspense fallback={null}>{page}</Suspense>;
}

export default App;
