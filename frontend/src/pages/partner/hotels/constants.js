import { HOTEL_TEXT } from '../../../constants/statusConfig';

export const TRANG_THAI = HOTEL_TEXT;

export const TAB_FILTER = {
  all: () => true,
  da_duyet: (h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai),
  cho_duyet: (h) => h.trang_thai === 'cho_duyet',
  tu_choi: (h) => h.trang_thai === 'tu_choi',
  khong_hoat_dong: (h) => h.trang_thai === 'bi_khoa',
};

export const ACTIVITY_FILTER = {
  all: () => true,
  hoat_dong: (h) => h.trang_thai === 'hoat_dong',
  khong_hoat_dong: (h) => h.trang_thai === 'bi_khoa',
};
