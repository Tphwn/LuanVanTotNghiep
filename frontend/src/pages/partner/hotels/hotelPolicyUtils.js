export const REQUIRED_DOC_LABELS = {
  cccd: 'CCCD/CMND',
  ho_chieu: 'Hộ chiếu',
  gplx: 'Giấy phép lái xe',
  visa: 'Thị thực nhập cảnh',
};

export const parseGiayToBatBuoc = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

export const toMoneyString = (value) => {
  if (value == null || value === '') return '';
  const raw = typeof value === 'object' && value !== null
    ? (value.toString?.() ?? String(value))
    : String(value);
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? '' : String(parseInt(digits, 10));
};

export const formatMoneyVnd = (value) => {
  const str = toMoneyString(value);
  if (!str) return '—';
  return `${Number(str).toLocaleString('vi-VN')} đ`;
};

export const formatYesNo = (value) => (value ? 'Có' : 'Không');
