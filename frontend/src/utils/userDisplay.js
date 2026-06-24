/** Lấy tên gọi (từ cuối) từ họ tên đầy đủ: "Đinh Thị Thu Phương" → "Phương" */
export const getGivenName = (hoTen) => {
  if (!hoTen?.trim()) return '';
  const parts = hoTen.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
};

export const resolveHoTen = (user) =>
  user?.ho_ten || user?.khach_hang?.ho_ten || '';
