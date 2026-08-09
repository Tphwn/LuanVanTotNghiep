
export const formatNumber = (value) => {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const formatCurrency = (value) => `${formatNumber(value)} VNĐ`;

export default formatCurrency;
