/**
 * Validate partner bank account (shared FE).
 * @returns {{ field?: string, message: string }|null}
 */
export const validateBankAccountForm = ({
  so_tai_khoan,
  ten_chu_tai_khoan,
  ma_ngan_hang,
}) => {
  const tenChu = String(ten_chu_tai_khoan || '').trim();
  const soTk = String(so_tai_khoan || '').trim();
  const maNh = String(ma_ngan_hang || '').trim();

  if (!tenChu) {
    return { field: 'ten_chu_tai_khoan', message: 'Vui lòng nhập tên chủ tài khoản' };
  }
  if (tenChu.length <= 2) {
    return { field: 'ten_chu_tai_khoan', message: 'Tên chủ tài khoản phải lớn hơn 2 ký tự' };
  }

  if (!soTk) {
    return { field: 'so_tai_khoan', message: 'Vui lòng nhập số tài khoản' };
  }
  if (!/^\d+$/.test(soTk)) {
    return { field: 'so_tai_khoan', message: 'Số tài khoản chỉ được chứa chữ số' };
  }
  if (soTk.length <= 1) {
    return { field: 'so_tai_khoan', message: 'Số tài khoản phải lớn hơn 1 chữ số' };
  }

  if (!maNh) {
    return { field: 'ma_ngan_hang', message: 'Vui lòng chọn ngân hàng' };
  }

  return null;
};

export const sanitizeAccountNumberInput = (value) => String(value || '').replace(/\D/g, '');
