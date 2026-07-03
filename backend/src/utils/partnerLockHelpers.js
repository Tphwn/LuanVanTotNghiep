const isLockedByPartner = (row) =>
  Boolean(Number(row?.khoa_do_doi_tac)) && row?.partner_user_status === 'bi_khoa';

const ACTIVE_HOTEL_STATUSES = ['hoat_dong', 'da_duyet'];

const getHotelPartnerLockState = async (tx, hotelId) => {
  const rows = await tx.$queryRaw`
    SELECT ks.khoa_do_doi_tac, nd.trang_thai AS partner_user_status
    FROM khach_san ks
    INNER JOIN doi_tac dt ON dt.ma_doi_tac = ks.ma_doi_tac
    INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dt.ma_nguoi_dung
    WHERE ks.ma_khach_san = ${Number(hotelId)}
    LIMIT 1
  `;
  return rows[0] || null;
};

const getRoomPartnerLockState = async (tx, roomId) => {
  const rows = await tx.$queryRaw`
    SELECT lp.khoa_do_doi_tac, nd.trang_thai AS partner_user_status
    FROM loai_phong lp
    INNER JOIN khach_san ks ON ks.ma_khach_san = lp.ma_khach_san
    INNER JOIN doi_tac dt ON dt.ma_doi_tac = ks.ma_doi_tac
    INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dt.ma_nguoi_dung
    WHERE lp.ma_loai_phong = ${Number(roomId)}
    LIMIT 1
  `;
  return rows[0] || null;
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

module.exports = {
  lockPartnerResources,
  unlockPartnerResources,
  syncAllLockedPartners,
  isLockedByPartner,
  getHotelPartnerLockState,
  getRoomPartnerLockState,
  activePartnerFilter,
  ACTIVE_HOTEL_STATUSES,
};
