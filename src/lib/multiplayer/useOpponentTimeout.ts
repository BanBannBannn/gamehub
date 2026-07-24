"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tự động xử thắng khi đối thủ mất kết nối quá lâu trong lúc đang chơi.
 *
 * Khi `active` = true (đang trong ván, chưa kết thúc, có đối thủ) và đối thủ
 * offline liên tục đủ `seconds` giây, gọi `onTimeout()` đúng 1 lần cho lượt
 * mất kết nối đó. Nếu đối thủ online trở lại, đồng hồ được đặt lại.
 *
 * Chỉ phía CÒN kết nối chạy được đoạn này (phía mất kết nối đã offline) nên
 * không lo cả 2 cùng xử thắng.
 */
export function useOpponentTimeout(params: {
  active: boolean;
  opponentOnline: boolean;
  seconds: number;
  onTimeout: () => void;
}): { secondsLeft: number | null } {
  const { active, opponentOnline, seconds, onTimeout } = params;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!active || opponentOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(null);
      return;
    }

    let remaining = seconds;
     
    setSecondsLeft(remaining);
    const id = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(id);
        setSecondsLeft(0);
        onTimeoutRef.current();
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [active, opponentOnline, seconds]);

  return { secondsLeft };
}
