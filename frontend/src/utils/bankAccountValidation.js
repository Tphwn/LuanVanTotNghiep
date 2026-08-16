const BANK_NAME_REGEX = /^[A-Z\s]+$/;
const BANK_ACCOUNT_REGEX = /^\d{6,19}$/;

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
  if (!BANK_NAME_REGEX.test(tenChu)) {
    return {
      field: 'ten_chu_tai_khoan',
      message: 'Tên chủ tài khoản phải viết hoa, không dấu và không chứa số/ký tự đặc biệt',
    };
  }

  if (!soTk) {
    return { field: 'so_tai_khoan', message: 'Vui lòng nhập số tài khoản' };
  }
  if (!BANK_ACCOUNT_REGEX.test(soTk)) {
    return { field: 'so_tai_khoan', message: 'Số tài khoản phải bao gồm từ 6 đến 19 chữ số' };
  }

  if (!maNh) {
    return { field: 'ma_ngan_hang', message: 'Vui lòng chọn ngân hàng' };
  }

  return null;
};

export const sanitizeAccountNumberInput = (value) => String(value || '').replace(/\D/g, '');
