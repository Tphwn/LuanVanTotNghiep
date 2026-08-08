/** Options hiển thị ngày kiểu Việt Nam: dd/mm/yyyy */
export const DATE_VN_OPTS = { day: '2-digit', month: '2-digit', year: 'numeric' };

export const formatVN = (dateStr) => {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** ISO yyyy-MM-dd → dd/mm/yyyy */
export const isoToDisplayDate = (iso) => {
  if (!iso || typeof iso !== 'string') return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
};

/**
 * dd/mm/yyyy (hoặc d/m/yyyy) → ISO yyyy-MM-dd
 * Chuỗi rỗng → ''; không hợp lệ → null
 */
export const displayDateToIso = (text) => {
  if (text == null) return null;
  const trimmed = String(text).trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** Hiển thị ngày dd/mm/yyyy (2 chữ số) */
export const formatDateVN = (date) => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', DATE_VN_OPTS);
};
