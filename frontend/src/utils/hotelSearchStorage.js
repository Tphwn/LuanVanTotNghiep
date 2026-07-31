const STORAGE_KEY = 'hotel_search_criteria';

const MAX_CHILD_AGE = 17;
const DEFAULT_CHILD_AGE = 1;

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
    tuoi_tre_em: [],
  };
};

export const CHILD_AGE_OPTIONS = [
  { value: 0, label: '< 1 tuổi' },
  ...Array.from({ length: MAX_CHILD_AGE }, (_, i) => {
    const age = i + 1;
    return { value: age, label: `${age} tuổi` };
  }),
];

const parseChildAges = (raw, treEm) => {
  let ages = [];
  if (Array.isArray(raw)) {
    ages = raw.map((v) => Number(v));
  } else if (typeof raw === 'string' && raw.trim()) {
    ages = raw.split(',').map((v) => Number(v.trim()));
  }

  const count = Math.max(0, Number(treEm) || 0);
  const normalized = [];
  for (let i = 0; i < count; i += 1) {
    const age = Number(ages[i]);
    if (Number.isFinite(age) && age >= 0 && age <= MAX_CHILD_AGE) {
      normalized.push(Math.floor(age));
    } else {
      normalized.push(DEFAULT_CHILD_AGE);
    }
  }
  return normalized;
};

export const normalizeSearchGuests = (form = {}) => {
  const so_khach = Math.max(1, Number(form.so_khach) || 1);
  const tre_em = Math.max(0, Number(form.tre_em) || 0);
  let so_phong = Math.max(1, Number(form.so_phong) || 1);
  so_phong = Math.min(so_phong, so_khach);
  const tuoi_tre_em = parseChildAges(form.tuoi_tre_em, tre_em);
  return { so_khach, tre_em, so_phong, tuoi_tre_em };
};

export const getTotalGuests = (form) => {
  const { so_khach, tre_em } = normalizeSearchGuests(form);
  return so_khach + tre_em;
};

export const getRoomCount = (form) => normalizeSearchGuests(form).so_phong;

export const getRequiredCapacity = (form) => {
  const { so_khach, so_phong } = normalizeSearchGuests(form);
  // Chỉ người lớn chiếm suc_chua
  return Math.ceil(so_khach / so_phong);
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

  const merged = { ...base };
  Object.entries(fromUrl).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Cho phép '' để ép về "Tất cả địa điểm"; các field khác bỏ qua chuỗi rỗng
    if (value === '' && key !== 'ma_dia_diem') return;
    merged[key] = value;
  });
  delete merged.so_giuong;

  return { ...merged, ...normalizeSearchGuests(merged) };
};

export const searchFormToParams = (form) => {
  const { so_khach, tre_em, so_phong, tuoi_tre_em } = normalizeSearchGuests(form);
  const params = new URLSearchParams();
  if (form.ma_dia_diem) params.set('ma_dia_diem', String(form.ma_dia_diem));
  if (form.ngay_nhan) params.set('ngay_nhan', form.ngay_nhan);
  if (form.ngay_tra) params.set('ngay_tra', form.ngay_tra);
  params.set('so_khach', String(so_khach));
  if (tre_em) {
    params.set('tre_em', String(tre_em));
    if (tuoi_tre_em.length > 0) {
      params.set('tuoi_tre_em', tuoi_tre_em.join(','));
    }
  }
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
