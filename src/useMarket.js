import { useCallback, useEffect, useRef, useState } from "react";

// /api/market 을 주기적으로 불러오는 공용 훅입니다.
export function useMarket(interval = 30000) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      if (!response.ok) throw new Error("시세 요청 실패");
      setData(await response.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, interval);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh, interval]);

  return { data, failed, loading, refresh };
}
