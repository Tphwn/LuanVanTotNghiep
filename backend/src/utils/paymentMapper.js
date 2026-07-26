const formatTxCode = (id) => `TXN-${String(id).padStart(6, '0')}`;

const TX_DISPLAY_STATUS = {
  thanh_cong: 'Thành công',
  that_bai: 'Thất bại',
  da_hoan_tien: 'Đã hoàn tiền',
  hoan_thanh: 'Hoàn thành',
  cho: 'Chờ',
};

const resolveGateway = (tx) => {
  if (tx.cong_thanh_toan) return tx.cong_thanh_toan;
  if (tx.phuong_thuc?.includes('MoMo')) return 'MoMo (Ví điện tử)';
  if (tx.phuong_thuc?.includes('VNPay')) return 'VNPay';
  if (tx.phuong_thuc?.includes('khách sạn') || tx.phuong_thuc?.includes('khach san')) {
    return 'Tại khách sạn';
  }
  return tx.phuong_thuc || '—';
};

/**
 * Trạng thái giao dịch hiển thị:
 * - that_bai: chỉ khi đã nhấn thanh toán nhưng giao dịch không thành công
 * - Không coi hủy đơn / chưa thanh toán là thất bại
 */
const resolveTransactionDisplayStatus = (tx) => {
  if (!tx) return 'cho';

  const bookingStatus = tx.dat_phong?.trang_thai;
  const refundRows = Array.isArray(tx.hoan_tien)
    ? tx.hoan_tien
    : (tx.hoan_tien ? [tx.hoan_tien] : []);
  const bookingRefund = tx.dat_phong?.hoan_tien;
  const refunded = refundRows.some((r) => r?.trang_thai === 'da_hoan')
    || bookingRefund?.trang_thai === 'da_hoan'
    || (Array.isArray(bookingRefund) && bookingRefund.some((r) => r?.trang_thai === 'da_hoan'));

  if (refunded) return 'da_hoan_tien';

  // Chỉ thất bại khi bản ghi thanh toán thực sự thất bại (đã thử thanh toán)
  if (tx.trang_thai === 'that_bai') return 'that_bai';

  // Chưa thanh toán (kể cả đơn đã hủy / hết hạn giữ chỗ)
  if (tx.trang_thai === 'cho' || !tx.trang_thai) return 'cho';

  if (tx.trang_thai === 'thanh_cong') {
    if (bookingStatus === 'hoan_thanh') return 'hoan_thanh';
    return 'thanh_cong';
  }

  return 'cho';
};

const mapTransaction = (tx) => {
  if (!tx) return null;

  const booking = tx.dat_phong;
  const customer = booking?.khach_hang;
  const hotel = booking?.loai_phong?.khach_san;
  const phone = customer?.nguoi_dung?.so_dien_thoai || booking?.sdt_nguoi_nhan || null;
  const trangThaiHienThi = resolveTransactionDisplayStatus(tx);

  return {
    ...tx,
    trang_thai_thanh_toan: tx.trang_thai,
    trang_thai: trangThaiHienThi,
    trang_thai_label: TX_DISPLAY_STATUS[trangThaiHienThi] || trangThaiHienThi,
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
  TX_DISPLAY_STATUS,
  resolveTransactionDisplayStatus,
  mapTransaction,
  mapTransactions,
};
