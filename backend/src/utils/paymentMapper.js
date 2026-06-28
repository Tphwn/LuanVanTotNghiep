const formatTxCode = (id) => `TXN-${String(id).padStart(6, '0')}`;

const resolveGateway = (tx) => {
  if (tx.cong_thanh_toan) return tx.cong_thanh_toan;
  if (tx.phuong_thuc?.includes('MoMo')) return 'MoMo (Ví điện tử)';
  if (tx.phuong_thuc?.includes('VNPay')) return 'VNPay';
  if (tx.phuong_thuc?.includes('khách sạn') || tx.phuong_thuc?.includes('khach san')) {
    return 'Tại khách sạn';
  }
  return tx.phuong_thuc || '—';
};

const mapTransaction = (tx) => {
  if (!tx) return null;

  const booking = tx.dat_phong;
  const customer = booking?.khach_hang;
  const hotel = booking?.loai_phong?.khach_san;
  const phone = customer?.nguoi_dung?.so_dien_thoai || booking?.sdt_nguoi_nhan || null;

  return {
    ...tx,
    ma_giao_dich: tx.ma_giao_dich || formatTxCode(tx.ma_thanh_toan),
    cong_thanh_toan: resolveGateway(tx),
    ngay_cap_nhat: tx.ngay_cap_nhat || tx.thoi_gian,
    khach_hang_ten: customer?.ho_ten || booking?.ten_nguoi_nhan || null,
    khach_hang_sdt: phone,
    ten_khach_san: hotel?.ten || null,
    ten_loai_phong: booking?.loai_phong?.ten_loai || null,
    ten_doi_tac: hotel?.doi_tac?.ten_cong_ty || null,
    ma_dat_phong: booking?.ma_dat_phong || null,
    ma_don_hang: booking?.ma_don_hang || null,
  };
};

const mapTransactions = (list = []) => list.map(mapTransaction);

module.exports = {
  formatTxCode,
  mapTransaction,
  mapTransactions,
};
