import { useCallback, useEffect, useRef, useState } from 'react';

/** Thời lượng hiển thị toast mặc định (ms) — thống nhất toàn hệ thống */
export const TOAST_DURATION = 3500;

/**
 * Hook quản lý toast dùng chung.
 * Trả về { toast, showToast, clearToast }.
 * - toast: { message, type } | null
 * - showToast(message, type = 'success', duration = TOAST_DURATION)
 */
export default function useToast(duration = TOAST_DURATION) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', ms = duration) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, ms);
  }, [duration]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast, clearToast };
}
