const prisma = require('../config/prisma');
const { isAdminCancelledBooking } = require('./refundHelpers');

const DEFAULT_COMMISSION_RATE = 15;
const COMMISSION_STATUS = {
  CHO_DOI_SOAT: 'chua_thu',
  DA_DOI_SOAT: 'da_thu',
  TAM_GIU: 'tam_giu',
  DA_THANH_TOAN: 'da_thanh_toan',
};

const CANCEL_STATUSES = new Set(['da_huy', 'tu_choi']);
const COMPLETE_STATUSES = new Set(['hoan_thanh', 'da_checkin']);

const resolveCommissionRate = (_hotel, partner, systemDefault = DEFAULT_COMMISSION_RATE) => {
  if (partner?.phan_tram_hoa_hong != null && partner.phan_tram_hoa_hong !== '') {
    return Number(partner.phan_tram_hoa_hong);
  }
  return Number(systemDefault) || DEFAULT_COMMISSION_RATE;
};
const getVatAmount = (booking) => {
  const goc = Number(booking?.tong_tien_goc) || 0;
  const giam = Number(booking?.tien_giam) || 0;
  const afterDiscount = Math.max(0, goc - giam);
  const paid = Number(booking?.thanh_toan_cuoi) || 0;
  return Math.max(0, Math.round(paid - afterDiscount));
};

const getPromoSource = (booking) => booking?.khuyen_mai?.loai_nguon || null;
const resolveCancelRefundPercent = (booking) => {
  if (!CANCEL_STATUSES.has(booking?.trang_thai)) return null;
  if (isAdminCancelledBooking(booking)) return 100;

  const paid = Number(booking?.thanh_toan_cuoi) || 0;
  const refundRow = booking?.hoan_tien;
  if (refundRow && ['cho_xu_ly', 'dang_xu_ly', 'da_hoan'].includes(refundRow.trang_thai)) {
    const soHoan = Number(refundRow.so_tien_hoan) || 0;
    if (paid <= 0) return soHoan > 0 ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round((soHoan / paid) * 100)));
  }
  return 0;
};
const calculateCommissionBreakdown = (booking, rate = DEFAULT_COMMISSION_RATE) => {
  const tongGoc = Number(booking?.tong_tien_goc) || 0;
  const tienGiam = Math.max(0, Number(booking?.tien_giam) || 0);
  const vat = getVatAmount(booking);
  const tyLe = Number(rate);
  const safeRate = Number.isFinite(tyLe) ? tyLe : DEFAULT_COMMISSION_RATE;
  const loaiNguon = getPromoSource(booking);

  if (CANCEL_STATUSES.has(booking?.trang_thai)) {
    const phanTramHoan = resolveCancelRefundPercent(booking);
    const phanTramGiu = Math.max(0, 100 - (Number(phanTramHoan) || 0));
    if (phanTramGiu <= 0 || tongGoc <= 0) {
      return {
        ty_le: safeRate,
        so_tien_hoa_hong: 0,
        tien_tro_gia_san: 0,
        hoa_hong_rong: 0,
        tien_doi_tac_nhan: 0,
        vat: 0,
        base: 0,
        gmv_doi_tac: 0,
        mode: 'cancel_full_refund',
        loai_nguon_km: loaiNguon,
      };
    }
    const basePhat = Math.round((tongGoc * phanTramGiu) / 100);
    const hh = Math.round((basePhat * safeRate) / 100);
    return {
      ty_le: safeRate,
      so_tien_hoa_hong: hh,
      tien_tro_gia_san: 0,
      hoa_hong_rong: hh,
      tien_doi_tac_nhan: Math.max(0, basePhat - hh),
      vat: 0,
      base: basePhat,
      gmv_doi_tac: basePhat,
      mode: 'cancel_penalty',
      loai_nguon_km: loaiNguon,
      phan_tram_hoan: phanTramHoan,
      phan_tram_giu: phanTramGiu,
    };
  }
  if (loaiNguon === 'he_thong' && tienGiam > 0) {
    const hh = Math.round((tongGoc * safeRate) / 100);
    const troGia = Math.round(tienGiam);
    return {
      ty_le: safeRate,
      so_tien_hoa_hong: hh,
      tien_tro_gia_san: troGia,
      hoa_hong_rong: hh - troGia,
      tien_doi_tac_nhan: Math.max(0, tongGoc - hh + vat),
      vat,
      base: tongGoc,
      gmv_doi_tac: tongGoc,
      mode: 'admin_promo',
      loai_nguon_km: loaiNguon,
    };
  }
  const tienGiamDoiTac = loaiNguon === 'doi_tac' ? tienGiam : 0;
  const base = Math.max(0, tongGoc - tienGiamDoiTac);
  const hh = Math.round((base * safeRate) / 100);
  return {
    ty_le: safeRate,
    so_tien_hoa_hong: hh,
    tien_tro_gia_san: 0,
    hoa_hong_rong: hh,
    tien_doi_tac_nhan: Math.max(0, base - hh + vat),
    vat,
    base,
    gmv_doi_tac: tongGoc,
    mode: tienGiamDoiTac > 0 ? 'partner_promo' : 'standard',
    loai_nguon_km: loaiNguon,
  };
};

const partnerAmountFromCommission = (booking, commissionRow) => {
  if (commissionRow && booking) {
    const rate = Number(commissionRow.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE;
    return calculateCommissionBreakdown(booking, rate);
  }
  if (booking) {
    return calculateCommissionBreakdown(booking, DEFAULT_COMMISSION_RATE);
  }
  return {
    so_tien_hoa_hong: 0,
    tien_tro_gia_san: 0,
    hoa_hong_rong: 0,
    tien_doi_tac_nhan: 0,
    gmv_doi_tac: 0,
  };
};

const isBookingEligibleForCommission = (booking) => {
  if (!booking) return false;
  const partnerId = booking.loai_phong?.khach_san?.ma_doi_tac;
  if (!partnerId) return false;

  if (COMPLETE_STATUSES.has(booking.trang_thai)) {
    const refund = booking.hoan_tien;
    if (refund && ['cho_xu_ly', 'dang_xu_ly', 'da_hoan'].includes(refund.trang_thai)) {
      const paid = Number(booking.thanh_toan_cuoi) || 0;
      const soHoan = Number(refund.so_tien_hoan) || 0;
      if (paid > 0 && soHoan >= paid * 0.99) return false;
    }
    return true;
  }

  if (CANCEL_STATUSES.has(booking.trang_thai)) {
    const breakdown = calculateCommissionBreakdown(booking, DEFAULT_COMMISSION_RATE);
    return breakdown.so_tien_hoa_hong > 0 || breakdown.tien_doi_tac_nhan > 0;
  }

  return false;
};

const loadBookingForCommission = async (maDatPhong, tx = prisma) => {
  return tx.dat_phong.findUnique({
    where: { ma_dat_phong: Number(maDatPhong) },
    include: {
      thanh_toan: true,
      hoan_tien: true,
      hoa_hong: true,
      khuyen_mai: {
        select: {
          ma_khuyen_mai: true,
          loai_nguon: true,
          ma_code: true,
        },
      },
      loai_phong: {
        include: {
          khach_san: {
            include: {
              doi_tac: {
                select: {
                  ma_doi_tac: true,
                  phan_tram_hoa_hong: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

/**
 
 * @param {number} maDatPhong
 * @param {{ tx?: object, forceRecalc?: boolean }} options
 */
const ensureCommissionForBooking = async (maDatPhong, options = {}) => {
  const { tx = prisma, forceRecalc = false } = options;
  const booking = await loadBookingForCommission(maDatPhong, tx);
  if (!booking) return null;

  const hotel = booking.loai_phong?.khach_san;
  const partner = hotel?.doi_tac;
  const maDoiTac = hotel?.ma_doi_tac || partner?.ma_doi_tac;
  if (!maDoiTac) return null;

  const tyLe = resolveCommissionRate(hotel, partner, DEFAULT_COMMISSION_RATE);
  const breakdown = calculateCommissionBreakdown(booking, tyLe);
  const existing = booking.hoa_hong;

  const isZero = breakdown.so_tien_hoa_hong <= 0 && breakdown.tien_doi_tac_nhan <= 0;
  if (isZero) {
    if (existing && existing.trang_thai === COMMISSION_STATUS.CHO_DOI_SOAT) {
      await tx.hoa_hong.delete({ where: { ma_hoa_hong: existing.ma_hoa_hong } });
    }
    return null;
  }

  if (!isBookingEligibleForCommission(booking) && !existing) {
    return null;
  }

  if (existing) {
    if (['da_thanh_toan', 'tam_giu'].includes(existing.trang_thai)) {
      return existing;
    }

    return tx.hoa_hong.update({
      where: { ma_hoa_hong: existing.ma_hoa_hong },
      data: {
        ty_le_hoa_hong: breakdown.ty_le,
        so_tien_hoa_hong: breakdown.so_tien_hoa_hong,
        tien_tro_gia_san: breakdown.tien_tro_gia_san,
      },
    });
  }

  if (!isBookingEligibleForCommission(booking)) return null;

  try {
    return await tx.hoa_hong.create({
      data: {
        ma_dat_phong: booking.ma_dat_phong,
        ma_doi_tac: Number(maDoiTac),
        ty_le_hoa_hong: breakdown.ty_le,
        so_tien_hoa_hong: breakdown.so_tien_hoa_hong,
        tien_tro_gia_san: breakdown.tien_tro_gia_san,
        trang_thai: COMMISSION_STATUS.CHO_DOI_SOAT,
      },
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return tx.hoa_hong.findUnique({ where: { ma_dat_phong: booking.ma_dat_phong } });
    }
    throw err;
  }
};

const syncEligibleCommissions = async (limit = 500) => {
  const targets = await prisma.dat_phong.findMany({
    where: {
      trang_thai: { in: ['hoan_thanh', 'da_checkin', 'da_huy', 'tu_choi'] },
      OR: [
        { hoa_hong: null },
        { hoa_hong: { trang_thai: { in: ['chua_thu', 'da_thu'] } } },
      ],
    },
    select: { ma_dat_phong: true },
    take: limit,
    orderBy: { ma_dat_phong: 'desc' },
  });

  let created = 0;
  for (const b of targets) {
    try {
      const row = await ensureCommissionForBooking(b.ma_dat_phong, { forceRecalc: true });
      if (row) created += 1;
    } catch (err) {
      console.error(`[commission] sync fail #${b.ma_dat_phong}:`, err.message);
    }
  }
  return created;
};

module.exports = {
  DEFAULT_COMMISSION_RATE,
  COMMISSION_STATUS,
  isBookingEligibleForCommission,
  ensureCommissionForBooking,
  syncEligibleCommissions,
  resolveCommissionRate,
  calculateCommissionBreakdown,
  partnerAmountFromCommission,
  getVatAmount,
  getPromoSource,
};
