import Stock from "./Stock.jsx";

// 종목 추가는 여기에 한 줄만 추가하면 됩니다.
const STOCKS = {
  "/samsung": { code: "005930", name: "삼성전자", market: "KOSPI" },
  // "/skhynix": { code: "000660", name: "SK하이닉스", market: "KOSPI" },
};

function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  const stock = STOCKS[path];
  if (!stock) return <></>;
  return <Stock key={stock.code} {...stock} />;
}

export default App;
