/** Slug tiện nghi — lưu DB, không hiển thị icon emoji trên UI */

export const AMENITY_ICON_MAP = {};

export const suggestIconSlugFromName = (name) => {
  if (!name) return 'wifi';
  const text = String(name).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const raw = String(name).toLowerCase();

  const keywords = [
    { keys: ['wifi', 'mạng', 'internet', 'wlan'], slug: 'wifi' },
    { keys: ['bể', 'bơi', 'pool', 'swim'], slug: 'pool' },
    { keys: ['đỗ xe', 'bãi đỗ', 'parking', 'garage'], slug: 'parking' },
    { keys: ['nhà hàng', 'restaurant', 'buffet'], slug: 'restaurant' },
    { keys: ['tủ lạnh', 'fridge'], slug: 'fridge' },
    { keys: ['gym', 'thể hình', 'fitness'], slug: 'gym' },
    { keys: ['spa', 'massa', 'massage', 'ghế'], slug: 'massage' },
    { keys: ['điều hòa', 'máy lạnh', 'ac'], slug: 'ac' },
    { keys: ['tivi', 'tv'], slug: 'tv' },
    { keys: ['bồn tắm', 'bathtub', 'tắm'], slug: 'bathtub' },
    { keys: ['bữa sáng', 'breakfast'], slug: 'breakfast' },
    { keys: ['bar', 'quầy bar'], slug: 'bar' },
    { keys: ['giặt', 'laundry'], slug: 'laundry' },
    { keys: ['thang máy', 'elevator'], slug: 'elevator' },
    { keys: ['an ninh', 'bảo vệ', 'security'], slug: 'security' },
    { keys: ['thú cưng', 'pet'], slug: 'pet' },
    { keys: ['ban công', 'balcony', 'view', 'cảnh'], slug: 'balcony' },
    { keys: ['bàn làm việc', 'desk'], slug: 'desk' },
    { keys: ['cà phê', 'coffee', 'trà'], slug: 'coffee' },
    { keys: ['đưa đón', 'shuttle'], slug: 'shuttle' },
    { keys: ['biển', 'beach'], slug: 'beach' },
    { keys: ['vườn', 'garden'], slug: 'garden' },
    { keys: ['họp', 'meeting'], slug: 'meeting' },
    { keys: ['trẻ em', 'kids'], slug: 'kids' },
    { keys: ['hút thuốc', 'smoke'], slug: 'smoke' },
    { keys: ['khuyết tật', 'xe lăn'], slug: 'accessible' },
    { keys: ['bếp', 'nấu', 'kitchen'], slug: 'kitchen' },
    { keys: ['giường', 'bed'], slug: 'bed' },
    { keys: ['ô tô', 'car', 'xe hơi'], slug: 'car' },
    { keys: ['đồ ăn', 'food'], slug: 'food' },
    { keys: ['minibar', 'nước'], slug: 'minibar' },
    { keys: ['y tế', 'thuốc'], slug: 'medicine' },
    { keys: ['điện thoại', 'phone'], slug: 'phone' },
    { keys: ['chìa khóa', 'key'], slug: 'key' },
    { keys: ['hành lý', 'luggage'], slug: 'luggage' },
    { keys: ['ủi', 'iron'], slug: 'iron' },
    { keys: ['sấy tóc', 'hairdryer'], slug: 'hairdryer' },
    { keys: ['két', 'safe'], slug: 'safe' },
  ];

  for (const { keys, slug } of keywords) {
    if (keys.some((k) => {
      const nk = k.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return text.includes(nk) || raw.includes(k);
    })) {
      return slug;
    }
  }
  return 'wifi';
};

export const AMENITY_ICON_PRESETS = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'pool', label: 'Hồ bơi' },
  { key: 'parking', label: 'Bãi đỗ xe' },
  { key: 'restaurant', label: 'Nhà hàng' },
  { key: 'kitchen', label: 'Bếp' },
  { key: 'fridge', label: 'Tủ lạnh' },
  { key: 'gym', label: 'Phòng gym' },
  { key: 'spa', label: 'Spa' },
  { key: 'massage', label: 'Massage' },
  { key: 'ac', label: 'Điều hòa' },
  { key: 'tv', label: 'TV' },
  { key: 'bathtub', label: 'Bồn tắm' },
  { key: 'breakfast', label: 'Bữa sáng' },
  { key: 'coffee', label: 'Cà phê' },
  { key: 'balcony', label: 'Ban công' },
  { key: 'bed', label: 'Giường' },
  { key: 'laundry', label: 'Giặt ủi' },
  { key: 'elevator', label: 'Thang máy' },
  { key: 'pet', label: 'Thú cưng' },
  { key: 'bar', label: 'Bar' },
  { key: 'beach', label: 'Biển' },
  { key: 'garden', label: 'Vườn' },
  { key: 'safe', label: 'Két sắt' },
  { key: 'minibar', label: 'Minibar' },
];

/**
 * Map từ slug → tên icon Lucide (dùng ở frontend để import động).
 * Import component icon từ lucide-react dựa theo key này.
 */
export const SLUG_TO_LUCIDE = {
  wifi:        'Wifi',
  pool:        'Waves',
  parking:     'ParkingCircle',
  restaurant:  'UtensilsCrossed',
  kitchen:     'ChefHat',
  fridge:      'Thermometer',
  gym:         'Dumbbell',
  spa:         'Sparkles',
  massage:     'Sparkles',
  ac:          'Wind',
  tv:          'Tv',
  bathtub:     'Droplets',
  breakfast:   'Coffee',
  coffee:      'Coffee',
  balcony:     'Sunset',
  bed:         'BedDouble',
  laundry:     'WashingMachine',
  elevator:    'ArrowUpDown',
  pet:         'PawPrint',
  bar:         'Wine',
  beach:       'Waves',
  garden:      'Flower2',
  safe:        'Lock',
  minibar:     'GlassWater',
  security:    'Shield',
  accessible:  'Accessibility',
  meeting:     'Users',
  kids:        'Baby',
  shuttle:     'Bus',
  luggage:     'Luggage',
  phone:       'Phone',
  key:         'KeyRound',
  iron:        'Shirt',
  hairdryer:   'Wind',
  desk:        'Monitor',
  car:         'Car',
  food:        'Utensils',
  medicine:    'Pill',
  bike:        'Bike',
  boat:        'Ship',
  game:        'Gamepad2',
  garden2:     'Trees',
};

export const getAmenityIcon = () => null;

export const resolveIconSlug = (bieuTuong, ten = '') => {
  if (bieuTuong && /^[a-z0-9_]+$/.test(String(bieuTuong).trim().toLowerCase())) {
    return String(bieuTuong).trim().toLowerCase();
  }
  return suggestIconSlugFromName(ten || bieuTuong);
};
