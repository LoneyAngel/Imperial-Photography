import { useState, useEffect, useCallback } from 'react';
export const useCountdown = (initialSeconds = 60) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const start = useCallback(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return { timeLeft, start, isCounting: timeLeft > 0 };
};