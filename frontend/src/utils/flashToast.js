const FLASH_TOAST_KEY = 'hb_flash_toast';
let memoryFlash = null;

export const setFlashToast = (message, type = 'success', duration = 2000) => {
  if (!message) return;
  const payload = {
    message,
    type,
    duration: Number(duration) > 0 ? Number(duration) : 2000,
  };
  memoryFlash = payload;
  try {
    sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

export const takeFlashToast = () => {
  let flash = memoryFlash;
  memoryFlash = null;

  try {
    if (!flash) {
      const raw = sessionStorage.getItem(FLASH_TOAST_KEY);
      if (raw) flash = JSON.parse(raw);
    }
    sessionStorage.removeItem(FLASH_TOAST_KEY);
  } catch {
    // ignore
  }

  if (!flash?.message) return null;
  return flash;
};
