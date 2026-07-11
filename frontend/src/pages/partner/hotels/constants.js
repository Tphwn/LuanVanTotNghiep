import { HOTEL_TEXT } from '../../../constants/statusConfig';

export const TRANG_THAI = HOTEL_TEXT;

export const TAB_FILTER = {
  all: () => true,
  da_duyet: (h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai),
  cho_duyet: (h) => h.trang_thai === 'cho_duyet',
  tu_choi: (h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai),
};
