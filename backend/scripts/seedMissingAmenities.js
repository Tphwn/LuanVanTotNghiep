/**
 * Seed tiện nghi còn thiếu từ danh sách Booking-style.
 * Map vào danh mục sẵn có; bỏ qua tên đã có (so khớp nới lỏng).
 * Chạy: node scripts/seedMissingAmenities.js
 */
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();

const normalize = (s) =>
  String(s || '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Danh sách cần bổ sung: ten, danh_muc, loai, bieu_tuong */
const TO_ADD = [
  // Thư giãn & vui chơi → dich_vu
  { ten: 'Câu lạc bộ đêm', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'bar' },
  { ten: 'Chuyến du lịch', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'shuttle' },
  { ten: 'Dịch vụ vé', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'ticket' },
  { ten: 'Karaoke', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'karaoke' },
  { ten: 'Mát-xa', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'massage' },
  { ten: 'Spa', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'spa' },
  { ten: 'Xông khô', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'sauna' },
  { ten: 'Vườn', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'garden' },

  // Dễ dàng tiếp cận → cong_cong / dich_vu
  { ten: 'Bình chữa cháy', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'CCTV bên ngoài chỗ nghỉ', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'CCTV trong khu vực chung', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'Địa điểm cầu hôn', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'garden' },
  { ten: 'Nhận/trả phòng nhanh', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'reception' },
  { ten: 'Nhận/trả phòng riêng', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'reception' },
  { ten: 'Nhận phòng 24 giờ', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'reception' },
  { ten: 'Phòng cách âm', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'curtain' },
  { ten: 'Phòng cho cặp đôi', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'bed' },
  { ten: 'Phòng có gương', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'vanity' },
  { ten: 'Phòng không hút thuốc', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'smoke' },
  { ten: 'Thiết bị báo cháy', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'security' },

  // Dịch vụ và tiện nghi → dich_vu / van_phong / chung
  { ten: 'Cơ sở vật chất cho họp mặt/tiệc lớn', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'meeting' },
  { ten: 'Cửa hàng quà tặng/quà lưu niệm', danh_muc: 'lan_can', loai: 'khach_san', bieu_tuong: 'shop' },
  { ten: 'Dịch vụ ủi đồ', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'iron' },
  { ten: 'Dịch vụ văn phòng (fax & photocopy)', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'desk' },
  { ten: 'Dọn phòng hằng ngày', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'laundry' },
  { ten: 'Địa điểm ngoài trời cho sự kiện đặc biệt', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'garden' },
  { ten: 'Địa điểm trong nhà cho sự kiện đặc biệt', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'meeting' },
  { ten: 'Đổi ngoại tệ', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'atm' },
  { ten: 'Giặt khô', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'laundry' },
  { ten: 'Hoàn toàn không hút thuốc', danh_muc: 'chung', loai: 'ca_hai', bieu_tuong: 'smoke' },
  { ten: 'Két sắt', danh_muc: 'chung', loai: 'ca_hai', bieu_tuong: 'safe' },
  { ten: 'Lò sưởi', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'ac' },
  { ten: 'Máy chiếu/Màn hình LED', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'meeting' },
  { ten: 'Máy sưởi ở khu vực chung', danh_muc: 'cong_cong', loai: 'khach_san', bieu_tuong: 'ac' },
  { ten: 'Nhận/trả phòng không tiếp xúc', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'reception' },
  { ten: 'Nhân viên chăm sóc khách hàng', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'meeting' },
  { ten: 'Nhân viên trực cửa', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'Phòng họp', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'meeting' },
  { ten: 'Thiết bị nghe nhìn cho sự kiện đặc biệt', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'meeting' },
  { ten: 'Thư viện', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'desk' },
  { ten: 'Tiện nghi làm việc', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'desk' },
  { ten: 'Vật dụng cho buổi họp', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'meeting' },
  { ten: 'Wi-Fi cho sự kiện đặc biệt', danh_muc: 'van_phong', loai: 'ca_hai', bieu_tuong: 'wifi' },

  // Có trong tất cả phòng → phong / phong_tam / ket_noi / bep
  { ten: 'Các loại khăn', danh_muc: 'phong_tam', loai: 'phong', bieu_tuong: 'towel' },
  { ten: 'Dép đi trong nhà', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'slippers' },
  { ten: 'Dịch vụ báo thức', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'phone' },
  { ten: 'Đầu báo khói', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'security' },
  { ten: 'Điện thoại', danh_muc: 'ket_noi', loai: 'phong', bieu_tuong: 'phone' },
  { ten: 'Không hút thuốc', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'smoke' },
  { ten: 'Máy pha trà/cà phê', danh_muc: 'bep', loai: 'phong', bieu_tuong: 'coffee' },
  { ten: 'Nước đóng chai miễn phí', danh_muc: 'bep', loai: 'phong', bieu_tuong: 'minibar' },
  { ten: 'Ô', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'umbrella' },
  { ten: 'Phòng tắm riêng', danh_muc: 'phong_tam', loai: 'phong', bieu_tuong: 'shower' },
  { ten: 'Sàn gỗ/gỗ miếng', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'floor' },
  { ten: 'Sử dụng CLB thể thao', danh_muc: 'dich_vu', loai: 'phong', bieu_tuong: 'gym' },
  { ten: 'Thảm', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'floor' },
  { ten: 'Thùng rác', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'bin' },
  { ten: 'Trà miễn phí', danh_muc: 'bep', loai: 'phong', bieu_tuong: 'coffee' },

  // Đi lại → van_chuyen
  { ten: 'Bãi đỗ xe gần bên', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'parking' },
  { ten: 'Bãi đỗ xe miễn phí', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'parking' },
  { ten: 'Bãi đỗ xe tại chỗ', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'parking' },
  { ten: 'Bãi đỗ xe có nhân viên', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'parking' },
  { ten: 'Dịch vụ đưa đón', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'shuttle' },
  { ten: 'Dịch vụ taxi', danh_muc: 'van_chuyen', loai: 'khach_san', bieu_tuong: 'car' },

  // Trẻ em → dich_vu
  { ten: 'CLB trẻ em', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'kids' },
  { ten: 'Cơ sở vật chất cho trẻ em', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'kids' },
  { ten: 'Dịch vụ trông trẻ', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'kids' },
  { ten: 'Phòng gia đình', danh_muc: 'phong', loai: 'phong', bieu_tuong: 'kids' },
  { ten: 'Thích hợp cho gia đình/trẻ em', danh_muc: 'dich_vu', loai: 'khach_san', bieu_tuong: 'kids' },

  // Thể thao lân cận
  { ten: 'Sân gôn (trong vòng 3 km)', danh_muc: 'lan_can', loai: 'khach_san', bieu_tuong: 'golf' },
];

/** Nếu existing khớp các từ khóa này thì coi như đã có */
const ALREADY_COVERED = [
  { match: ['ao choang tam'], covers: ['ao choang tam'] },
  { match: ['am nau nuoc', 'am nuoc'], covers: ['am nuoc dien'] },
  { match: ['ban lam viec'], covers: ['ban lam viec'] },
  { match: ['bon tam'], covers: ['bon tam'] },
  { match: ['may say toc'], covers: ['may say toc'] },
  { match: ['ket an toan trong phong', 'ket sat trong phong'], covers: ['ket sat trong phong'] },
  { match: ['khong hut thuoc'], covers: [] }, // will add room-level separately; hotel smoking area exists
  { match: ['khu vuc hut thuoc'], covers: ['khu vuc hut thuoc'] },
  { match: ['phong gym', 'phong tap'], covers: ['phong tap', 'phong gym'] },
  { match: ['dua don san bay'], covers: ['dua don san bay'] },
  { match: ['thang may'], covers: ['thang may'] },
  { match: ['bao ve 24'], covers: ['bao ve 24 gio', 'bao ve 24'] },
  { match: ['le tan 24', 'ban tiep tan 24'], covers: ['ban tiep tan 24 gio', 'le tan 24h'] },
  { match: ['giu hanh ly', 'luu tru', 'bao quan hanh ly'], covers: ['giu hanh ly'] },
  { match: ['giat ui', 'giat la'], covers: ['dich vu giat la', 'dich vu giat ui'] },
  { match: ['san choi', 'vui choi tre em'], covers: ['san choi'] },
  { match: ['bai do xe'], covers: [] }, // generic exists; still add specific variants
  { match: ['wifi', 'wi fi'], covers: ['truy cap internet khong day'] },
  { match: ['truyen hinh cap'], covers: ['truyen hinh cap ve tinh'] },
  { match: ['tu lanh'], covers: ['tu lanh nho trong phong'] },
  { match: ['tu treo quan ao', 'tu quan ao'], covers: ['tu quan ao'] },
  { match: ['do ve sinh', 'vat dung tam'], covers: ['vat dung tam rua'] },
  { match: ['phong tam voi sen', 'voi sen'], covers: ['voi sen'] },
  { match: ['may atm', 'ngan hang'], covers: ['rut tien mat'] },
  { match: ['cua hang'], covers: [] },
  { match: ['khan tam', 'cac loai khan'], covers: [] },
  { match: ['nuoc'], covers: [] },
  { match: ['nhan phong cap toc', 'tra phong cap toc'], covers: ['nhan tra phong nhanh'] },
];

const isAlreadyPresent = (candidateTen, existingNorms) => {
  const cand = normalize(candidateTen);

  // Exact / contains either way
  for (const ex of existingNorms) {
    if (ex === cand || ex.includes(cand) || cand.includes(ex)) {
      // Avoid "nuoc" matching everything with nuoc - require length
      if (Math.min(ex.length, cand.length) < 4 && ex !== cand) continue;
      return true;
    }
  }

  // Special: Nhận phòng 24h covered by Lễ tân 24h? Not really - keep separate
  // Special: wifi sự kiện không bị coi trùng wifi thường
  if (cand.includes('su kien') && cand.includes('wi')) {
    return existingNorms.some((e) => e.includes('su kien') && e.includes('wi'));
  }

  // Covered by ALREADY_COVERED rules when existing matches
  for (const rule of ALREADY_COVERED) {
    const hasExisting = rule.match.some((m) => existingNorms.some((e) => e.includes(m)));
    if (!hasExisting) continue;
    if (rule.covers.some((c) => cand.includes(c) || c.includes(cand))) return true;
  }

  // Phòng tập / GYM
  if ((cand.includes('phong tap') || cand === 'phong gym')
    && existingNorms.some((e) => e.includes('gym') || e.includes('phong tap'))) {
    return true;
  }

  return false;
};

(async () => {
  const existing = await p.tien_nghi.findMany({
    select: { ma_tien_nghi: true, ten: true },
  });
  const existingNorms = existing.map((r) => normalize(r.ten));

  const toInsert = [];
  const skipped = [];

  for (const item of TO_ADD) {
    if (isAlreadyPresent(item.ten, existingNorms)) {
      skipped.push(item.ten);
      continue;
    }
    // Also skip if exact name already queued
    if (toInsert.some((x) => normalize(x.ten) === normalize(item.ten))) {
      skipped.push(`${item.ten} (trùng trong list)`);
      continue;
    }
    toInsert.push(item);
  }

  let created = 0;
  for (const item of toInsert) {
    await p.tien_nghi.create({
      data: {
        ten: item.ten,
        danh_muc: item.danh_muc,
        loai: item.loai,
        bieu_tuong: item.bieu_tuong,
        trang_thai: 'hoat_dong',
      },
    });
    created += 1;
    existingNorms.push(normalize(item.ten));
  }

  console.log(JSON.stringify({
    existing: existing.length,
    skipped: skipped.length,
    skippedNames: skipped,
    created,
    createdNames: toInsert.map((x) => x.ten),
  }, null, 2));

  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
