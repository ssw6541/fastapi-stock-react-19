// 종목 추가는 여기에 한 줄만 추가하면 됩니다. (경로는 "/slug" 로 열립니다)
export const STOCKS = {
  samsung: { code: "005930", name: "삼성전자", market: "KOSPI" },
  skhynix: { code: "000660", name: "SK하이닉스", market: "KOSPI" },
  lgenergy: { code: "373220", name: "LG에너지솔루션", market: "KOSPI" },
  samsungbio: { code: "207940", name: "삼성바이오로직스", market: "KOSPI" },
  hyundai: { code: "005380", name: "현대차", market: "KOSPI" },
  kia: { code: "000270", name: "기아", market: "KOSPI" },
  posco: { code: "005490", name: "POSCO홀딩스", market: "KOSPI" },
  naver: { code: "035420", name: "NAVER", market: "KOSPI" },
  kbfinancial: { code: "105560", name: "KB금융", market: "KOSPI" },
  shinhan: { code: "055550", name: "신한지주", market: "KOSPI" },
  kakao: { code: "035720", name: "카카오", market: "KOSPI" },
  samsungsdi: { code: "006400", name: "삼성SDI", market: "KOSPI" },
  ecoprobm: { code: "247540", name: "에코프로비엠", market: "KOSDAQ" },
  ecopro: { code: "086520", name: "에코프로", market: "KOSDAQ" },
  alteogen: { code: "196170", name: "알테오젠", market: "KOSDAQ" },
  hlb: { code: "028300", name: "HLB", market: "KOSDAQ" },
  celltrionpharm: { code: "068760", name: "셀트리온제약", market: "KOSDAQ" },
  jyp: { code: "035900", name: "JYP Ent.", market: "KOSDAQ" },
  kakaogames: { code: "293490", name: "카카오게임즈", market: "KOSDAQ" },
  pearlabyss: { code: "263750", name: "펄어비스", market: "KOSDAQ" },
};

export const slugOf = (code) =>
  Object.keys(STOCKS).find((slug) => STOCKS[slug].code === code);
