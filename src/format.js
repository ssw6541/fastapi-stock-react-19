export const fmt = (n) => n.toLocaleString("ko-KR");
export const pct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
export const dirOf = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");
export const arrow = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "–");
