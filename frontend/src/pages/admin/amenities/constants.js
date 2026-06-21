import {
  Building2, BedDouble, ConciergeBell, MapPin, Wifi, Tv,
} from 'lucide-react';

export const LOAI_LABEL = {
  khach_san: { label: 'Khách sạn', cls: 'badge-info' },
  phong:     { label: 'Loại phòng', cls: 'badge-success' },
  ca_hai:    { label: 'Cả hai', cls: 'badge-warning' },
};

export const REQUEST_STATUS = {
  cho_xu_ly: { label: 'Đang chờ', cls: 'badge-warning' },
  da_tao:    { label: 'Đã duyệt', cls: 'badge-success' },
  tu_choi:   { label: 'Từ chối', cls: 'badge-danger' },
};

export const HOTEL_CATEGORY_GROUPS = [
  {
    id: 'dich_vu', label: 'Dịch vụ khách sạn', Icon: ConciergeBell,
    slugs: ['pool', 'gym', 'spa', 'massage', 'restaurant', 'bar', 'breakfast', 'laundry', 'coffee', 'shuttle', 'beach', 'garden', 'luggage', 'meeting', 'kids', 'pet', 'security', 'accessible'],
  },
  {
    id: 'cong_cong', label: 'Tiện nghi công cộng', Icon: Building2,
    slugs: ['wifi', 'elevator', 'parking'],
  },
  {
    id: 'lan_can', label: 'Các tiện ích lân cận', Icon: MapPin,
    slugs: [],
  },
];

export const ROOM_CATEGORY_GROUPS = [
  {
    id: 'phong', label: 'Tiện nghi phòng', Icon: BedDouble,
    slugs: ['ac', 'fridge', 'bathtub', 'balcony', 'bed', 'safe', 'minibar', 'hairdryer', 'iron', 'desk', 'kitchen', 'coffee', 'phone', 'laundry'],
  },
  {
    id: 'ket_noi', label: 'Kết nối mạng', Icon: Wifi,
    slugs: ['wifi', 'tv'],
  },
  {
    id: 'giai_tri', label: 'Giải trí', Icon: Tv,
    slugs: [],
  },
];
