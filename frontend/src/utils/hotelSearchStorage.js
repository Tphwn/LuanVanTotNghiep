const STORAGE_KEY = 'hotel_search_criteria';

export const getDefaultSearchForm = () => {
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return {
    ma_dia_diem: '',
    ngay_nhan: addDays(new Date(), 1),
    ngay_tra: addDays(new Date(), 2),
    so_khach: 2,
    tre_em: 0,
    so_phong: 1,
  };
};

export const normalizeSearchGuests = (form = {}) => {
  const so_khach = Math.max(1, Number(form.so_khach) || 1);
  const tre_em = Math.max(0, Number(form.tre_em) || 0);
  let so_phong = Math.max(1, Number(form.so_phong) || 1);
  so_phong = Math.min(so_phong, so_khach);
  return { so_khach, tre_em, so_phong };
};

export const getTotalGuests = (form) => {
  const { so_khach, tre_em } = normalizeSearchGuests(form);
  return so_khach + tre_em;
};

export const getRoomCount = (form) => normalizeSearchGuests(form).so_phong;

export const getRequiredCapacity = (form) => {
  const { so_khach, tre_em, so_phong } = normalizeSearchGuests(form);
  return Math.ceil((so_khach + tre_em) / so_phong);
};

export const loadSearchForm = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveSearchForm = (form) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
};

export const clearSearchForm = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

export const hasSavedSearch = () => Boolean(loadSearchForm());
export const resolveSearchForm = (fromUrl = {}) => {
  const defaults = getDefaultSearchForm();
  const saved = loadSearchForm();
  const base = saved ? { ...defaults, ...saved } : defaults;

  const patch = Object.fromEntries(
    Object.entries(fromUrl).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );

  const merged = { ...base, ...patch };
  delete merged.so_giuong;

  return { ...merged, ...normalizeSearchGuests(merged) };
};

export const searchFormToParams = (form) => {
  const { so_khach, tre_em, so_phong } = normalizeSearchGuests(form);
  const params = new URLSearchParams();
  if (form.ma_dia_diem) params.set('ma_dia_diem', String(form.ma_dia_diem));
  if (form.ngay_nhan) params.set('ngay_nhan', form.ngay_nhan);
  if (form.ngay_tra) params.set('ngay_tra', form.ngay_tra);
  params.set('so_khach', String(so_khach));
  if (tre_em) params.set('tre_em', String(tre_em));
  params.set('so_phong', String(so_phong));
  return params;
};

export const isDefaultSearchForm = (form) => {
  const defaults = getDefaultSearchForm();
  return (
    !form.ma_dia_diem
    && form.ngay_nhan === defaults.ngay_nhan
    && form.ngay_tra === defaults.ngay_tra
    && Number(form.so_khach) === defaults.so_khach
    && Number(form.tre_em) === defaults.tre_em
    && Number(form.so_phong) === defaults.so_phong
  );
};
