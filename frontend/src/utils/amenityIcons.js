
import {
  Wifi, Tv, ConciergeBell, Waves, ParkingCircle, UtensilsCrossed, ChefHat,
  Dumbbell, Sparkles, Wind, Droplets, Coffee, Sunset, BedDouble, Shirt, ArrowUpDown,
  PawPrint, Wine, Flower2, Lock, GlassWater, Shield, Accessibility, Users, Baby, Bus,
  Luggage, Phone, KeyRound, Monitor, Car, Utensils, Pill, Bike, Ship, Gamepad2, Trees,
  CircleDot, Blinds, Armchair, Microwave, Refrigerator, WashingMachine, Store,
  ShowerHead, Cigarette, Landmark, PlugZap, Bath, Ticket, Mic2, Umbrella, Trash2, Flag,
} from 'lucide-react';

export const AMENITY_ICON_MAP = {};

export const DEFAULT_AMENITY_ICON_SLUG = 'default';

const stripDiacritics = (value) =>
  String(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const keywordMatches = (text, raw, key) => {
  const nk = stripDiacritics(key);
  if (nk.length <= 2) {
    const re = new RegExp(`(?:^|[^a-z0-9])${nk}(?:$|[^a-z0-9])`, 'i');
    return re.test(text) || re.test(raw);
  }
  return text.includes(nk) || raw.includes(key);
};

export const suggestIconSlugFromName = (name) => {
  if (!name) return DEFAULT_AMENITY_ICON_SLUG;
  const text = stripDiacritics(name);
  const raw = String(name).toLowerCase();
  const keywords = [
    { keys: ['xe điện', 'sạc điện', 'charging', 'ev'], slug: 'ev' },
    { keys: ['lò vi sóng', 'microwave', 'vi sóng'], slug: 'microwave' },
    { keys: ['tủ treo', 'tủ quần áo', 'wardrobe', 'móc áo'], slug: 'wardrobe' },
    { keys: ['rèm', 'curtain', 'blinds', 'cản sáng'], slug: 'curtain' },
    { keys: ['áo choàng', 'bathrobe', 'robe'], slug: 'bathrobe' },
    { keys: ['khăn tắm', 'khăn'], slug: 'towel' },
    { keys: ['đồ vệ sinh', 'toiletries', 'xà phòng', 'vệ sinh cá nhân'], slug: 'toiletries' },
    { keys: ['bi-a', 'bi a', 'billiard'], slug: 'game' },
    { keys: ['siêu thị', 'cửa hàng', 'supermarket', 'shop'], slug: 'shop' },
    { keys: ['ấm nấu', 'ấm đun', 'bình đun', 'kettle'], slug: 'kettle' },
    { keys: ['nước nóng'], slug: 'kettle' },
    { keys: ['wifi', 'wi-fi', 'mạng', 'internet', 'wlan'], slug: 'wifi' },
    { keys: ['bể bơi', 'hồ bơi', 'pool', 'swim'], slug: 'pool' },
    { keys: ['đỗ xe', 'bãi đỗ', 'parking', 'garage'], slug: 'parking' },
    { keys: ['bữa sáng', 'breakfast'], slug: 'breakfast' },
    { keys: ['nhà hàng', 'restaurant', 'buffet'], slug: 'restaurant' },
    { keys: ['tủ lạnh', 'fridge', 'refrigerator'], slug: 'fridge' },
    { keys: ['spa'], slug: 'spa' },
    { keys: ['xông khô', 'sauna', 'xong kho'], slug: 'sauna' },
    { keys: ['mát-xa', 'massage', 'mat xa'], slug: 'massage' },
    { keys: ['karaoke'], slug: 'karaoke' },
    { keys: ['vé', 'ticket'], slug: 'ticket' },
    { keys: ['dép', 'slippers'], slug: 'slippers' },
    { keys: ['ô ', 'ô dù', 'umbrella'], slug: 'umbrella' },
    { keys: ['thùng rác', 'trash'], slug: 'bin' },
    { keys: ['sân gôn', 'golf'], slug: 'golf' },
    { keys: ['sàn gỗ', 'thảm', 'parquet'], slug: 'floor' },
    { keys: ['gym', 'thể hình', 'fitness', 'phòng tập'], slug: 'gym' },
    { keys: ['điều hòa', 'máy lạnh', 'máy điều hòa'], slug: 'ac' },
    { keys: ['tivi', 'truyền hình', 'tv'], slug: 'tv' },
    { keys: ['bồn tắm', 'bathtub'], slug: 'bathtub' },
    { keys: ['vòi sen', 'phòng tắm'], slug: 'shower' },
    { keys: ['quầy bar', 'bar'], slug: 'bar' },
    { keys: ['giặt', 'laundry'], slug: 'laundry' },
    { keys: ['thang máy', 'elevator'], slug: 'elevator' },
    { keys: ['an ninh', 'bảo vệ', 'security'], slug: 'security' },
    { keys: ['thú cưng', 'pet'], slug: 'pet' },
    { keys: ['ban công', 'balcony', 'view', 'cảnh'], slug: 'balcony' },
    { keys: ['bàn làm việc', 'desk'], slug: 'desk' },
    { keys: ['bàn trang điểm'], slug: 'vanity' },
    { keys: ['cà phê', 'coffee', 'tiệm trà', 'trà đá'], slug: 'coffee' },
    { keys: ['đưa đón', 'shuttle'], slug: 'shuttle' },
    { keys: ['biển', 'beach'], slug: 'beach' },
    { keys: ['vườn', 'garden'], slug: 'garden' },
    { keys: ['concierge', 'hỗ trợ khách', 'họp', 'meeting'], slug: 'meeting' },
    { keys: ['lễ tân', 'nhận phòng', 'trả phòng'], slug: 'reception' },
    { keys: ['trẻ em', 'kids', 'sân chơi', 'vui chơi'], slug: 'kids' },
    { keys: ['hút thuốc', 'smoke'], slug: 'smoke' },
    { keys: ['khuyết tật', 'xe lăn'], slug: 'accessible' },
    { keys: ['bếp', 'kitchen'], slug: 'kitchen' },
    { keys: ['giường', 'bed'], slug: 'bed' },
    { keys: ['ô tô', 'xe hơi', 'car'], slug: 'car' },
    { keys: ['đồ ăn', 'food'], slug: 'food' },
    { keys: ['minibar', 'nước suối', 'đồ uống'], slug: 'minibar' },
    { keys: ['y tế', 'thuốc'], slug: 'medicine' },
    { keys: ['điện thoại', 'phone'], slug: 'phone' },
    { keys: ['chìa khóa', 'cấp tốc', 'key'], slug: 'key' },
    { keys: ['hành lý', 'luggage'], slug: 'luggage' },
    { keys: ['ủi', 'iron'], slug: 'iron' },
    { keys: ['sấy tóc', 'hairdryer'], slug: 'hairdryer' },
    { keys: ['két', 'safe'], slug: 'safe' },
    { keys: ['atm', 'ngân hàng'], slug: 'atm' },
    { keys: ['early'], slug: 'key' },
    { keys: ['late'], slug: 'key' },
  ];

  for (const { keys, slug } of keywords) {
    if (keys.some((k) => keywordMatches(text, raw, k))) {
      return slug;
    }
  }
  return DEFAULT_AMENITY_ICON_SLUG;
};

export const AMENITY_ICON_PRESETS = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'pool', label: 'Hồ bơi' },
  { key: 'parking', label: 'Bãi đỗ xe' },
  { key: 'restaurant', label: 'Nhà hàng' },
  { key: 'kitchen', label: 'Bếp' },
  { key: 'fridge', label: 'Tủ lạnh' },
  { key: 'microwave', label: 'Lò vi sóng' },
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
  { key: 'ev', label: 'Xe điện' },
  { key: 'curtain', label: 'Rèm' },
];

export const SLUG_TO_LUCIDE = {
  wifi: 'Wifi',
  pool: 'Waves',
  parking: 'ParkingCircle',
  restaurant: 'UtensilsCrossed',
  kitchen: 'ChefHat',
  fridge: 'Refrigerator',
  microwave: 'Microwave',
  gym: 'Dumbbell',
  spa: 'Sparkles',
  massage: 'Sparkles',
  ac: 'Wind',
  tv: 'Tv',
  bathtub: 'Bath',
  shower: 'ShowerHead',
  breakfast: 'Coffee',
  coffee: 'Coffee',
  balcony: 'Sunset',
  bed: 'BedDouble',
  laundry: 'WashingMachine',
  elevator: 'ArrowUpDown',
  pet: 'PawPrint',
  bar: 'Wine',
  beach: 'Waves',
  garden: 'Flower2',
  safe: 'Lock',
  minibar: 'GlassWater',
  security: 'Shield',
  accessible: 'Accessibility',
  meeting: 'Users',
  kids: 'Baby',
  shuttle: 'Bus',
  luggage: 'Luggage',
  phone: 'Phone',
  key: 'KeyRound',
  iron: 'Shirt',
  hairdryer: 'Wind',
  desk: 'Monitor',
  car: 'Car',
  food: 'Utensils',
  medicine: 'Pill',
  bike: 'Bike',
  boat: 'Ship',
  game: 'Gamepad2',
  garden2: 'Trees',
  ev: 'PlugZap',
  curtain: 'Blinds',
  vanity: 'Armchair',
  wardrobe: 'Shirt',
  bathrobe: 'Bath',
  towel: 'Droplets',
  toiletries: 'Sparkles',
  shop: 'Store',
  kettle: 'Coffee',
  reception: 'ConciergeBell',
  atm: 'Landmark',
  smoke: 'Cigarette',
  ticket: 'Ticket',
  karaoke: 'Mic2',
  sauna: 'Sparkles',
  slippers: 'Shirt',
  umbrella: 'Umbrella',
  floor: 'CircleDot',
  bin: 'Trash2',
  golf: 'Flag',
  default: 'CircleDot',
};

const SLUG_ICON_MAP = {
  wifi: Wifi,
  pool: Waves,
  parking: ParkingCircle,
  restaurant: UtensilsCrossed,
  kitchen: ChefHat,
  fridge: Refrigerator,
  microwave: Microwave,
  gym: Dumbbell,
  spa: Sparkles,
  massage: Sparkles,
  ac: Wind,
  tv: Tv,
  bathtub: Bath,
  shower: ShowerHead,
  breakfast: Coffee,
  coffee: Coffee,
  balcony: Sunset,
  bed: BedDouble,
  laundry: WashingMachine,
  elevator: ArrowUpDown,
  pet: PawPrint,
  bar: Wine,
  beach: Waves,
  garden: Flower2,
  safe: Lock,
  minibar: GlassWater,
  security: Shield,
  accessible: Accessibility,
  meeting: Users,
  kids: Baby,
  shuttle: Bus,
  luggage: Luggage,
  phone: Phone,
  key: KeyRound,
  iron: Shirt,
  hairdryer: Wind,
  desk: Monitor,
  car: Car,
  food: Utensils,
  medicine: Pill,
  bike: Bike,
  boat: Ship,
  game: Gamepad2,
  garden2: Trees,
  ev: PlugZap,
  curtain: Blinds,
  vanity: Armchair,
  wardrobe: Shirt,
  bathrobe: Bath,
  towel: Droplets,
  toiletries: Sparkles,
  shop: Store,
  kettle: Coffee,
  reception: ConciergeBell,
  atm: Landmark,
  smoke: Cigarette,
  ticket: Ticket,
  karaoke: Mic2,
  sauna: Sparkles,
  slippers: Shirt,
  umbrella: Umbrella,
  floor: CircleDot,
  bin: Trash2,
  golf: Flag,
  default: CircleDot,
};

const isIconSlug = (value) => /^[a-z0-9_]+$/i.test(String(value || '').trim());
export const getAmenityLucideIcon = (bieuTuong, ten = '') => {
  const raw = String(bieuTuong || '').trim();
  const slug = isIconSlug(raw) ? raw.toLowerCase() : '';
  const name = ten || (!slug ? raw : '');

  const fromName = name ? suggestIconSlugFromName(name) : DEFAULT_AMENITY_ICON_SLUG;
  if (fromName !== DEFAULT_AMENITY_ICON_SLUG && SLUG_ICON_MAP[fromName]) {
    return SLUG_ICON_MAP[fromName];
  }

  if (slug && SLUG_ICON_MAP[slug]) {
     if (slug === 'wifi' && name && suggestIconSlugFromName(name) !== 'wifi') {
      return CircleDot;
    }
    return SLUG_ICON_MAP[slug];
  }

  if (!slug && raw) {
    const suggested = suggestIconSlugFromName(raw);
    return SLUG_ICON_MAP[suggested] || CircleDot;
  }

  return CircleDot;
};

export const resolveIconSlug = (bieuTuong, ten = '') => {
  const fromName = suggestIconSlugFromName(ten);
  if (fromName !== DEFAULT_AMENITY_ICON_SLUG) return fromName;

  if (bieuTuong && isIconSlug(bieuTuong)) {
    const slug = String(bieuTuong).trim().toLowerCase();
    if (SLUG_ICON_MAP[slug]) {
      if (slug === 'wifi' && ten && fromName !== 'wifi') {
        return DEFAULT_AMENITY_ICON_SLUG;
      }
      return slug;
    }
  }

  return suggestIconSlugFromName(ten || bieuTuong);
};

export const getAmenityIcon = () => null;
