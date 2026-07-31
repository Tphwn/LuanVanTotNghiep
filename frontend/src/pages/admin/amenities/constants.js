import {
  Building2, BedDouble, ConciergeBell, MapPin, Wifi,
  Bus, UtensilsCrossed, Shield, Monitor, Droplets, ChefHat,
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

export const AMENITY_SCOPE = {
  khach_san: { label: 'Tiện nghi khách sạn', desc: 'Hiển thị khi đối tác tạo / sửa khách sạn' },
  phong: { label: 'Tiện nghi loại phòng', desc: 'Hiển thị khi đối tác tạo / sửa loại phòng' },
};

export const AMENITY_CATEGORY_GROUPS = [
  {
    id: 'phong', label: 'Tiện nghi phòng', Icon: BedDouble, loai: 'phong',
    slugs: ['ac', 'tv', 'balcony', 'bed', 'safe', 'iron', 'laundry', 'desk', 'slippers', 'umbrella', 'floor', 'bin', 'smoke', 'phone'],
  },
  {
    id: 'phong_tam', label: 'Đồ dùng phòng tắm', Icon: Droplets, loai: 'phong',
    slugs: ['bathtub', 'hairdryer', 'shower', 'towel', 'toiletries'],
  },
  {
    id: 'bep', label: 'Tiện nghi bếp', Icon: ChefHat, loai: 'phong',
    slugs: ['kitchen', 'fridge', 'minibar', 'coffee', 'kettle'],
  },
  {
    id: 'ket_noi', label: 'Kết nối mạng', Icon: Wifi, loai: 'phong',
    slugs: ['wifi', 'phone'],
  },
  {
    id: 'dich_vu', label: 'Dịch vụ khách sạn', Icon: ConciergeBell, loai: 'khach_san',
    slugs: ['pool', 'gym', 'spa', 'sauna', 'massage', 'karaoke', 'ticket', 'laundry', 'luggage', 'meeting', 'kids', 'pet', 'security', 'accessible', 'garden', 'beach', 'key', 'bar'],
  },
  {
    id: 'cong_cong', label: 'Tiện nghi công cộng', Icon: Building2, loai: 'khach_san',
    slugs: ['elevator', 'wifi', 'parking', 'early_checkin', 'late_checkout', 'security', 'ac'],
  },
  {
    id: 'lan_can', label: 'Các tiện ích lân cận', Icon: MapPin, loai: 'khach_san',
    slugs: ['atm', 'shop', 'golf', 'beach'],
  },
  {
    id: 'van_chuyen', label: 'Vận chuyển', Icon: Bus, loai: 'khach_san',
    slugs: ['shuttle', 'car', 'bus', 'parking'],
  },
  {
    id: 'am_thuc', label: 'Ẩm thực', Icon: UtensilsCrossed, loai: 'khach_san',
    slugs: ['restaurant', 'bar', 'breakfast', 'food'],
  },
  {
    id: 'chung', label: 'Tiện nghi chung', Icon: Shield, loai: 'ca_hai',
    slugs: ['safe', 'security', 'luggage', 'accessible', 'pet', 'elevator', 'laundry', 'smoke'],
  },
  {
    id: 'van_phong', label: 'Tiện nghi văn phòng', Icon: Monitor, loai: 'ca_hai',
    slugs: ['desk', 'meeting', 'wifi', 'phone'],
  },
];

export const HOTEL_CATEGORY_GROUPS = AMENITY_CATEGORY_GROUPS.filter((g) =>
  ['dich_vu', 'cong_cong', 'lan_can', 'van_chuyen', 'am_thuc', 'chung'].includes(g.id),
);

export const ROOM_CATEGORY_GROUPS = AMENITY_CATEGORY_GROUPS.filter((g) =>
  ['phong', 'phong_tam', 'bep', 'ket_noi', 'chung', 'van_phong'].includes(g.id),
);
