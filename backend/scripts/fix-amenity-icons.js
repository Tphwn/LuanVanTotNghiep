/**
 * Cập nhật bieu_tuong theo tên tiện nghi (sửa slug wifi mặc định sai).
 * Chạy: node scripts/fix-amenity-icons.js
 */
const { PrismaClient } = require('@prisma/client');

const DEFAULT_SLUG = 'default';

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

const suggestIconSlugFromName = (name) => {
  if (!name) return DEFAULT_SLUG;
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
    { keys: ['gym', 'thể hình', 'fitness'], slug: 'gym' },
    { keys: ['spa', 'massa', 'massage'], slug: 'massage' },
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
  ];

  for (const { keys, slug } of keywords) {
    if (keys.some((k) => keywordMatches(text, raw, k))) {
      return slug;
    }
  }
  return DEFAULT_SLUG;
};

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.tien_nghi.findMany({
    select: { ma_tien_nghi: true, ten: true, bieu_tuong: true },
  });

  let updated = 0;
  for (const row of rows) {
    const next = suggestIconSlugFromName(row.ten);
    if (next === DEFAULT_SLUG) continue;
    if (next !== row.bieu_tuong) {
      await prisma.tien_nghi.update({
        where: { ma_tien_nghi: row.ma_tien_nghi },
        data: { bieu_tuong: next },
      });
      console.log(`${row.ten}: ${row.bieu_tuong} -> ${next}`);
      updated += 1;
    }
  }
  console.log(`Done. Updated ${updated}/${rows.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
