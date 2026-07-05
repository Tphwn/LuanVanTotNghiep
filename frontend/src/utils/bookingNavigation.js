import ROUTES from '../constants/routes';
import { resolveSearchForm, normalizeSearchGuests } from './hotelSearchStorage';

export const resolveBookingQuery = (partial = {}) => {
  const resolved = resolveSearchForm({
    ma_dia_diem: partial.ma_dia_diem,
    ngay_nhan: partial.ngay_nhan,
    ngay_tra: partial.ngay_tra,
    so_khach: partial.so_khach,
    tre_em: partial.tre_em,
    so_phong: partial.so_phong,
  });

  const guests = normalizeSearchGuests({
    so_khach: partial.so_khach || resolved.so_khach,
    tre_em: partial.tre_em ?? resolved.tre_em,
    so_phong: partial.so_phong || resolved.so_phong,
  });

  return {
    ma_khach_san: partial.ma_khach_san || '',
    ma_loai_phong: partial.ma_loai_phong || '',
    ma_dia_diem: partial.ma_dia_diem || resolved.ma_dia_diem || '',
    ngay_nhan: partial.ngay_nhan || resolved.ngay_nhan,
    ngay_tra: partial.ngay_tra || resolved.ngay_tra,
    so_khach: String(guests.so_khach),
    tre_em: String(guests.tre_em),
    so_phong: String(guests.so_phong),
  };
};

export const buildCustomerBookingUrl = (hotelId, roomId, query = {}) => {
  const q = resolveBookingQuery({
    ...query,
    ma_khach_san: String(hotelId),
    ma_loai_phong: String(roomId),
  });

  const params = new URLSearchParams();
  params.set('ma_khach_san', String(hotelId));
  params.set('ma_loai_phong', String(roomId));
  params.set('ngay_nhan', q.ngay_nhan);
  params.set('ngay_tra', q.ngay_tra);
  params.set('so_khach', q.so_khach);
  if (q.tre_em && q.tre_em !== '0') params.set('tre_em', q.tre_em);
  params.set('so_phong', q.so_phong);
  if (q.ma_dia_diem) params.set('ma_dia_diem', q.ma_dia_diem);

  return `${ROUTES.CUSTOMER.BOOKING}?${params.toString()}`;
};
