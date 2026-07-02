export const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

export default formatCurrency;
