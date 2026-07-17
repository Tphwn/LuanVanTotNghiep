import { useEffect, useState } from 'react';
import Toast from './Toast';
import { setFlashToast, takeFlashToast } from '../../utils/flashToast';

const DEFAULT_MS = 2000;
/** Remount Strict Mode (dev) thường < 50ms — chỉ khi đó mới trả flash lại. */
const STRICT_REMOUNT_MS = 80;

/**
 * Toast flash sau đăng nhập — state + timer riêng,
 * tự tắt sau ~2s, không bị kẹt đến khi reload.
 */
const FlashToastHost = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const flash = takeFlashToast();
    if (!flash?.message) return undefined;

    const mountedAt = Date.now();
    const ms = Number(flash.duration) > 0 ? Number(flash.duration) : DEFAULT_MS;

    setToast({
      message: flash.message,
      type: flash.type === 'error' ? 'error' : 'success',
    });

    const timerId = window.setTimeout(() => {
      setToast(null);
    }, ms);

    return () => {
      window.clearTimeout(timerId);
      // React Strict Mode (dev): effect cleanup rồi chạy lại ngay → trả flash để lần mount sau còn hiện
      if (Date.now() - mountedAt < STRICT_REMOUNT_MS) {
        setFlashToast(flash.message, flash.type, flash.duration);
      }
    };
  }, []);

  return <Toast toast={toast} />;
};

export default FlashToastHost;
