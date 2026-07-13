const prisma = require('../../config/prisma');
const { attachHotelImages } = require('../../utils/images');
const { getUserId } = require('../../utils/user');
const { parseJsonField } = require('../../utils/parseJson');
const { parseHotelRulesInput } = require('../../utils/hotelRules');
const { isLockedByAdminHotel } = require('../../utils/partnerLockHelpers');

const SYSTEM_DEFAULT_CANCEL_POLICIES = [
  { so_ngay_truoc: 7, phan_tram_hoan: 100 },
  { so_ngay_truoc: 3, phan_tram_hoan: 50 },
  { so_ngay_truoc: 1, phan_tram_hoan: 10 },
];

const getPartnerDefaultCancelPolicies = (hotels) => {
  const source = hotels.find((h) => h.chinh_sach_huy?.length > 0);
  if (!source) return SYSTEM_DEFAULT_CANCEL_POLICIES;

  return source.chinh_sach_huy
    .filter((p) => p.trang_thai === 'hoat_dong')
    .map((p) => ({
      so_ngay_truoc: p.so_ngay_truoc,
      phan_tram_hoan: Number(p.phan_tram_hoan),
    }))
    .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc);
};

const fetchHotelFull = async (hotelId) => {
  const hotel = await prisma.khach_san.findUnique({
    where: { ma_khach_san: hotelId },
    include: {
      dia_diem: true,
      khach_san_tien_nghi: { include: { tien_nghi: true } },
      chinh_sach_huy: { where: { trang_thai: 'hoat_dong' }, orderBy: { so_ngay_truoc: 'desc' } },
    },
  });

  if (!hotel) return null;

  const hinh_anh = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
    orderBy: { thu_tu: 'asc' },
  });

  return { ...hotel, hinh_anh };
};

const saveCancelPolicies = async (tx, hotelId, policies) => {
  await tx.chinh_sach_huy.deleteMany({ where: { ma_khach_san: hotelId } });
  if (policies.length > 0) {
    await tx.chinh_sach_huy.createMany({
      data: policies.map((cs) => ({
        ma_khach_san: hotelId,
        so_ngay_truoc: parseInt(cs.so_ngay_truoc),
        phan_tram_hoan: parseFloat(cs.phan_tram_hoan),
        trang_thai: 'hoat_dong',
      })),
    });
  }
};

const applyMainImage = async (tx, hotelId, { mainImageId, mainNewIndex, mainImageIndex, files = [] }) => {
  await tx.hinh_anh.updateMany({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
    data: { la_anh_chinh: false },
  });

  if (mainImageId) {
    await tx.hinh_anh.updateMany({
      where: {
        ma_hinh_anh: parseInt(mainImageId),
        loai_doi_tuong: 'khach_san',
        ma_doi_tuong: hotelId,
      },
      data: { la_anh_chinh: true },
    });
    return;
  }

  const idx = mainNewIndex !== undefined && mainNewIndex !== null && mainNewIndex !== ''
    ? parseInt(mainNewIndex)
    : parseInt(mainImageIndex || 0);

  if (files.length > 0) {
    const allImages = await tx.hinh_anh.findMany({
      where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
      orderBy: { thu_tu: 'asc' },
    });
    const newlyAdded = allImages.slice(-files.length);
    const target = newlyAdded[Math.min(idx, Math.max(newlyAdded.length - 1, 0))];
    if (target) {
      await tx.hinh_anh.update({
        where: { ma_hinh_anh: target.ma_hinh_anh },
        data: { la_anh_chinh: true },
      });
    }
    return;
  }

  const first = await tx.hinh_anh.findFirst({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
    orderBy: { thu_tu: 'asc' },
  });
  if (first) {
    await tx.hinh_anh.update({
      where: { ma_hinh_anh: first.ma_hinh_anh },
      data: { la_anh_chinh: true },
    });
  }
};

exports.createHotel = async (req, res) => {
  try {
    const { ten, dia_chi, mo_ta, so_sao, gio_nhan_phong, gio_tra_phong, ma_dia_diem } = req.body;
    const tien_nghi_ids = parseJsonField(req.body.tien_nghi_ids, []);
    const chinh_sach_huy = parseJsonField(req.body.chinh_sach_huy, []);
    const hotelRules = parseHotelRulesInput(req.body);
    const userId = getUserId(req.user);

    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên ít nhất 1 hình ảnh' });
    }

    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: userId },
    });

    if (!doiTac) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn không có hồ sơ đối tác!' });
    }

    const hotelId = await prisma.$transaction(async (tx) => {
      const newHotel = await tx.khach_san.create({
        data: {
          ma_doi_tac: doiTac.ma_doi_tac,
          ma_dia_diem: parseInt(ma_dia_diem),
          ten,
          dia_chi,
          mo_ta,
          so_sao: parseInt(so_sao),
          gio_nhan_phong: new Date(`1970-01-01T${gio_nhan_phong}:00.000Z`),
          gio_tra_phong: new Date(`1970-01-01T${gio_tra_phong}:00.000Z`),
          trang_thai: 'cho_duyet',
          ...hotelRules,
        },
      });

      if (tien_nghi_ids.length > 0) {
        await tx.khach_san_tien_nghi.createMany({
          data: tien_nghi_ids.map((id) => ({
            ma_khach_san: newHotel.ma_khach_san,
            ma_tien_nghi: parseInt(id),
          })),
        });
      }

      await saveCancelPolicies(tx, newHotel.ma_khach_san, chinh_sach_huy);

      const imgData = req.files.map((file, idx) => ({
        loai_doi_tuong: 'khach_san',
        ma_doi_tuong: newHotel.ma_khach_san,
        url: `/uploads/${file.filename}`,
        la_anh_chinh: false,
        thu_tu: idx,
      }));
      await tx.hinh_anh.createMany({ data: imgData });

      await applyMainImage(tx, newHotel.ma_khach_san, {
        mainImageIndex: req.body.mainImageIndex,
        files: req.files,
      });

      return newHotel.ma_khach_san;
    });

    const result = await fetchHotelFull(hotelId);
    res.status(201).json({ success: true, message: 'Tạo khách sạn thành công!', data: result });
  } catch (error) {
    console.error('Lỗi khi thêm khách sạn:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi khởi tạo khách sạn.' });
  }
};

exports.getMyHotels = async (req, res) => {
  try {
    const userId = getUserId(req.user);

    if (isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc không có ID người dùng' });
    }

    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: userId },
    });

    if (!doiTac) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ đối tác của bạn!' });
    }

    const hotels = await prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTac.ma_doi_tac },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
        chinh_sach_huy: { where: { trang_thai: 'hoat_dong' }, orderBy: { so_ngay_truoc: 'desc' } },
      },
      orderBy: { ngay_tao: 'desc' },
    });

    const defaultCancelPolicies = getPartnerDefaultCancelPolicies(hotels);
    const hotelsWithImages = await attachHotelImages(hotels);

    res.status(200).json({
      success: true,
      data: hotelsWithImages,
      defaultCancelPolicies,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách sạn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu khách sạn' });
  }
};

exports.getDiaDiem = async (req, res) => {
  try {
    const diaDiem = await prisma.dia_diem.findMany({
      orderBy: { ten_dia_diem: 'asc' },
    });
    res.status(200).json({ success: true, data: diaDiem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy địa điểm' });
  }
};

exports.getAmenities = async (req, res) => {
  try {
    const amenities = await prisma.tien_nghi.findMany({
      where: {
        loai: { in: ['khach_san', 'ca_hai'] },
        trang_thai: 'hoat_dong',
      },
      orderBy: { ten: 'asc' },
    });
    res.status(200).json({ success: true, data: amenities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy tiện nghi' });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const hotelId = parseInt(req.params.id);

    if (isNaN(userId) || isNaN(hotelId)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: userId },
    });

    if (!doiTac) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ đối tác của bạn!' });
    }

    const existing = await prisma.khach_san.findFirst({
      where: { ma_khach_san: hotelId, ma_doi_tac: doiTac.ma_doi_tac },
      select: {
        ma_khach_san: true,
        trang_thai: true,
        khoa_do_doi_tac: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn' });
    }

    const {
      ten, dia_chi, mo_ta, so_sao,
      gio_nhan_phong, gio_tra_phong,
      ma_dia_diem, trang_thai,
    } = req.body;

    const tien_nghi_ids = req.body.tien_nghi_ids !== undefined
      ? parseJsonField(req.body.tien_nghi_ids, [])
      : undefined;
    const chinh_sach_huy = req.body.chinh_sach_huy !== undefined
      ? parseJsonField(req.body.chinh_sach_huy, [])
      : undefined;
    const hotelRules = parseHotelRulesInput(req.body);
    const removedImageIds = parseJsonField(req.body.removedImageIds, []);

    const updateData = {};
    if (ten !== undefined) updateData.ten = ten;
    if (dia_chi !== undefined) updateData.dia_chi = dia_chi;
    if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
    if (so_sao !== undefined) updateData.so_sao = parseInt(so_sao);
    if (gio_nhan_phong !== undefined) {
      updateData.gio_nhan_phong = new Date(`1970-01-01T${gio_nhan_phong}:00.000Z`);
    }
    if (gio_tra_phong !== undefined) {
      updateData.gio_tra_phong = new Date(`1970-01-01T${gio_tra_phong}:00.000Z`);
    }
    if (ma_dia_diem !== undefined) {
      updateData.dia_diem = { connect: { ma_dia_diem: parseInt(ma_dia_diem, 10) } };
    }
    if (trang_thai !== undefined) {
      if (trang_thai === 'bi_khoa') {
        updateData.trang_thai = 'bi_khoa';
        updateData.khoa_do_doi_tac = true;
      } else if (trang_thai === 'hoat_dong') {
        if (isLockedByAdminHotel(existing)) {
          return res.status(400).json({
            success: false,
            message: 'Khách sạn đang bị admin khóa. Bạn không thể mở khóa.',
          });
        }
        updateData.trang_thai = 'hoat_dong';
        updateData.khoa_do_doi_tac = false;
      } else {
        updateData.trang_thai = trang_thai;
      }
    }
    Object.assign(updateData, hotelRules);

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.khach_san.update({
          where: { ma_khach_san: hotelId },
          data: updateData,
        });
      }

      if (tien_nghi_ids !== undefined) {
        await tx.khach_san_tien_nghi.deleteMany({ where: { ma_khach_san: hotelId } });
        if (tien_nghi_ids.length > 0) {
          await tx.khach_san_tien_nghi.createMany({
            data: tien_nghi_ids.map((id) => ({
              ma_khach_san: hotelId,
              ma_tien_nghi: parseInt(id),
            })),
          });
        }
      }

      if (chinh_sach_huy !== undefined) {
        await saveCancelPolicies(tx, hotelId, chinh_sach_huy);
      }

      if (removedImageIds.length > 0) {
        await tx.hinh_anh.deleteMany({
          where: {
            ma_hinh_anh: { in: removedImageIds.map((id) => parseInt(id)) },
            loai_doi_tuong: 'khach_san',
            ma_doi_tuong: hotelId,
          },
        });
      }

      if (req.files?.length > 0) {
        const currentCount = await tx.hinh_anh.count({
          where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
        });

        await tx.hinh_anh.createMany({
          data: req.files.map((file, idx) => ({
            loai_doi_tuong: 'khach_san',
            ma_doi_tuong: hotelId,
            url: `/uploads/${file.filename}`,
            la_anh_chinh: false,
            thu_tu: currentCount + idx,
          })),
        });
      }

      if (
        req.body.mainImageId !== undefined
        || req.body.mainNewIndex !== undefined
        || req.files?.length > 0
      ) {
        await applyMainImage(tx, hotelId, {
          mainImageId: req.body.mainImageId,
          mainNewIndex: req.body.mainNewIndex,
          files: req.files || [],
        });
      }
    });

    const updated = await fetchHotelFull(hotelId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Lỗi cập nhật khách sạn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật khách sạn' });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const hotelId = parseInt(req.params.id, 10);

    if (isNaN(userId) || isNaN(hotelId)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: userId },
    });

    if (!doiTac) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ đối tác của bạn!' });
    }

    const hotel = await prisma.khach_san.findFirst({
      where: { ma_khach_san: hotelId, ma_doi_tac: doiTac.ma_doi_tac },
    });

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn' });
    }

    if (hotel.trang_thai !== 'cho_duyet') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa khách sạn đang chờ admin duyệt',
      });
    }

    const bookingCount = await prisma.dat_phong.count({
      where: { loai_phong: { ma_khach_san: hotelId } },
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa khách sạn đã có đơn đặt phòng',
      });
    }

    await prisma.$transaction(async (tx) => {
      const roomTypes = await tx.loai_phong.findMany({
        where: { ma_khach_san: hotelId },
        select: { ma_loai_phong: true },
      });
      const roomIds = roomTypes.map((r) => r.ma_loai_phong);

      if (roomIds.length > 0) {
        await tx.bang_gia_phong.deleteMany({ where: { ma_loai_phong: { in: roomIds } } });
        await tx.loai_phong_tien_nghi.deleteMany({ where: { ma_loai_phong: { in: roomIds } } });
        await tx.hinh_anh.deleteMany({
          where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: { in: roomIds } },
        });
        await tx.loai_phong.deleteMany({ where: { ma_khach_san: hotelId } });
      }

      await tx.chinh_sach_huy.deleteMany({ where: { ma_khach_san: hotelId } });
      await tx.khach_san_tien_nghi.deleteMany({ where: { ma_khach_san: hotelId } });
      await tx.hinh_anh.deleteMany({
        where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
      });
      await tx.khach_san.delete({ where: { ma_khach_san: hotelId } });
    });

    res.json({ success: true, message: 'Đã xóa khách sạn thành công' });
  } catch (error) {
    console.error('Lỗi xóa khách sạn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa khách sạn' });
  }
};
