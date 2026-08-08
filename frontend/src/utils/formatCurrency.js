/**
 * Chỉ số có dấu chấm nghìn — dùng cho ô nhập giá.
 * VD: 1500000 → "1.500.000"
 */
export const formatNumber = (value) => {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Hiển thị tiền đồng nhất trên UI.
 * VD: 1500000 → "1.500.000 VNĐ"
 */
export const formatCurrency = (value) => `${formatNumber(value)} VNĐ`;

export default formatCurrency;
