const isLockedByPartner = (row) => Boolean(row?.khoa_do_doi_tac);

const isLockedByAdminHotel = (row) =>
  row?.trang_thai === 'bi_khoa' && !row?.khoa_do_doi_tac;

const isLockedByAdminRoom = (row) =>
  row?.trang_thai === 'an' && !row?.khoa_do_doi_tac;

const getHotelLockState = async (tx, hotelId) => {
  return tx.khach_san.findUnique({
    where: { ma_khach_san: Number(hotelId) },
    select: { trang_thai: true, khoa_do_doi_tac: true },
  });
};

const getRoomLockState = async (tx, roomId) => {
  return tx.loai_phong.findUnique({
    where: { ma_loai_phong: Number(roomId) },
    select: {
      trang_thai: true,
      khoa_do_doi_tac: true,
      so_luong_mo_ban: true,
      so_luong_phong: true,
      so_luong_mo_ban_truoc_khoa: true,
    },
  });
};

const lockAdminHotelResources = async (tx, hotelId, lyDoKhoa) => {
  const id = Number(hotelId);
  const hotel = await getHotelLockState(tx, id);

  if (!hotel) {
    throw { statusCode: 404, message: 'Không tìm thấy khách sạn' };
  }

  if (isLockedByPartner(hotel)) {
    throw {
      statusCode: 400,
      message: 'Khách sạn đang bị đối tác khóa. Bạn không thể khóa theo cách admin.',
    };
  }

  await tx.$executeRaw`
    UPDATE loai_phong
    SET
      trang_thai = 'an',
      so_luong_mo_ban_truoc_khoa = so_luong_mo_ban,
      so_luong_mo_ban = 0
    WHERE ma_khach_san = ${id}
      AND trang_thai = 'hoat_dong'
      AND khoa_do_doi_tac = false
  `;

  return tx.khach_san.update({
    where: { ma_khach_san: id },
    data: {
      trang_thai: 'bi_khoa',
      ly_do_khoa: lyDoKhoa,
      khoa_do_doi_tac: false,
    },
    select: {
      ma_khach_san: true,
      ten: true,
      ma_doi_tac: true,
    },
  });
};

const unlockAdminHotelResources = async (tx, hotelId) => {
  const id = Number(hotelId);
  const hotel = await getHotelLockState(tx, id);

  if (!hotel) {
    throw { statusCode: 404, message: 'Không tìm thấy khách sạn' };
  }

  if (isLockedByPartner(hotel)) {
    throw {
      statusCode: 400,
      message: 'Khách sạn đang bị đối tác khóa.',
    };
  }

  await tx.$executeRaw`
    UPDATE loai_phong
    SET
      trang_thai = 'hoat_dong',
      so_luong_mo_ban = COALESCE(so_luong_mo_ban_truoc_khoa, so_luong_phong),
      so_luong_mo_ban_truoc_khoa = NULL
    WHERE ma_khach_san = ${id}
      AND trang_thai = 'an'
      AND khoa_do_doi_tac = false
      AND so_luong_mo_ban_truoc_khoa IS NOT NULL
  `;

  return tx.khach_san.update({
    where: { ma_khach_san: id },
    data: {
      trang_thai: 'hoat_dong',
      ly_do_khoa: null,
      khoa_do_doi_tac: false,
    },
    select: {
      ma_khach_san: true,
      ten: true,
      ma_doi_tac: true,
    },
  });
};

const lockPartnerResources = async (tx, maDoiTac) => {
  const partnerId = Number(maDoiTac);

  await tx.doi_tac.update({
    where: { ma_doi_tac: partnerId },
    data: { trang_thai: 'bi_khoa' },
  });

  await tx.$executeRaw`
    UPDATE khach_san
    SET trang_thai = 'bi_khoa', khoa_do_doi_tac = true
    WHERE ma_doi_tac = ${partnerId}
      AND trang_thai IN ('hoat_dong', 'da_duyet')
  `;

  await tx.$executeRaw`
    UPDATE loai_phong lp
    INNER JOIN khach_san ks ON ks.ma_khach_san = lp.ma_khach_san
    SET
      lp.trang_thai = 'an',
      lp.khoa_do_doi_tac = true,
      lp.so_luong_mo_ban_truoc_khoa = lp.so_luong_mo_ban,
      lp.so_luong_mo_ban = 0
    WHERE ks.ma_doi_tac = ${partnerId}
      AND lp.trang_thai = 'hoat_dong'
  `;
};

const unlockPartnerResources = async (tx, maDoiTac) => {
  const partnerId = Number(maDoiTac);

  await tx.doi_tac.update({
    where: { ma_doi_tac: partnerId },
    data: { trang_thai: 'hoat_dong' },
  });

  await tx.$executeRaw`
    UPDATE loai_phong lp
    INNER JOIN khach_san ks ON ks.ma_khach_san = lp.ma_khach_san
    SET
      lp.trang_thai = 'hoat_dong',
      lp.khoa_do_doi_tac = false,
      lp.so_luong_mo_ban = COALESCE(lp.so_luong_mo_ban_truoc_khoa, lp.so_luong_phong),
      lp.so_luong_mo_ban_truoc_khoa = NULL
    WHERE ks.ma_doi_tac = ${partnerId}
      AND lp.khoa_do_doi_tac = true
  `;

  await tx.$executeRaw`
    UPDATE khach_san
    SET trang_thai = 'hoat_dong', khoa_do_doi_tac = false
    WHERE ma_doi_tac = ${partnerId}
      AND khoa_do_doi_tac = true
      AND trang_thai = 'bi_khoa'
  `;
};

const syncAllLockedPartners = async (prisma) => {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT dt.ma_doi_tac
    FROM doi_tac dt
    INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dt.ma_nguoi_dung
    WHERE nd.trang_thai = 'bi_khoa'
  `;

  for (const row of rows) {
    await prisma.$transaction((tx) => lockPartnerResources(tx, Number(row.ma_doi_tac)));
  }

  return rows.length;
};

const activePartnerFilter = {
  doi_tac: {
    trang_thai: 'hoat_dong',
    nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
      trang_thai: 'hoat_dong',
    },
  },
};

const ACTIVE_HOTEL_STATUSES = ['hoat_dong', 'da_duyet'];

module.exports = {
  lockPartnerResources,
  unlockPartnerResources,
  lockAdminHotelResources,
  unlockAdminHotelResources,
  syncAllLockedPartners,
  isLockedByPartner,
  isLockedByAdminHotel,
  isLockedByAdminRoom,
  getHotelLockState,
  getRoomLockState,
  getHotelPartnerLockState: getHotelLockState,
  getRoomPartnerLockState: getRoomLockState,
  activePartnerFilter,
  ACTIVE_HOTEL_STATUSES,
};
