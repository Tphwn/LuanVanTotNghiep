const { PrismaClient } = require('@prisma/client');
const { countActiveBookedRooms, calcRoomAvailability } = require('../../utils/bookingHelpers');
const { isLockedByAdminRoom } = require('../../utils/partnerLockHelpers');
const {
  parseBedCounts,
  validateBedsByCapacity,
  formatBedLabel,
} = require('../../utils/bedHelpers');
const prisma = new PrismaClient();

const safeInt = (val) => parseInt(val) || 0;
const safeFloat = (val) => parseFloat(val) || 0.0;
const parseJsonField = (value, fallback) => {
  if (!value) return fallback;
  try { return typeof value === 'string' ? JSON.parse(value) : value; } 
  catch { return fallback; }
};

const calcMoBanOnTotalChange = (existing, newSoPhong) => {
  const oldTong = Number(existing.so_luong_phong) || 0;
  const oldMoBan = Number(existing.so_luong_mo_ban) || 0;
  if (existing.trang_thai !== 'hoat_dong') return oldMoBan;
  if (oldTong > 0 && oldMoBan >= oldTong) return newSoPhong;
  if (oldMoBan > 0 && newSoPhong > oldTong) {
    return Math.min(oldMoBan + (newSoPhong - oldTong), newSoPhong);
  }
  if (newSoPhong < oldTong) return Math.min(oldMoBan, newSoPhong);
  return oldMoBan;
};

const applyMainImage = async (tx, roomId, { mainImageId, mainNewIndex, files = [] }) => {
  await tx.hinh_anh.updateMany({ 
    where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: roomId }, 
    data: { la_anh_chinh: false } 
  });
  
  if (mainImageId) {
    await tx.hinh_anh.updateMany({ 
      where: { ma_hinh_anh: parseInt(mainImageId) }, 
      data: { la_anh_chinh: true } 
    });
  } else if (files.length > 0) {
    const idx = parseInt(mainNewIndex) || 0;
    const allImages = await tx.hinh_anh.findMany({ 
      where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: roomId }, 
      orderBy: { thu_tu: 'asc' } 
    });
    if (allImages[idx]) {
      await tx.hinh_anh.update({ 
        where: { ma_hinh_anh: allImages[idx].ma_hinh_anh }, 
        data: { la_anh_chinh: true } 
      });
    }
  }
};
//api admin lấy danh sách phòng
exports.getMyRooms = async (req, res) => {
  try {
    const hotelId = parseInt(req.query.hotelId);
    if (!hotelId) return res.status(400).json({ success: false, message: 'Thiếu hotelId' });

    const rooms = await prisma.loai_phong.findMany({
      where: { ma_khach_san: hotelId },
      orderBy: { ma_loai_phong: 'desc' }
    });

    const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
      const tienNghi = await prisma.loai_phong_tien_nghi.findMany({
        where: { ma_loai_phong: room.ma_loai_phong },
        include: { tien_nghi: true },
      });
      const hinhAnh = await prisma.hinh_anh.findMany({
        where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: room.ma_loai_phong },
        orderBy: { thu_tu: 'asc' },
      });
      const daDat = await countActiveBookedRooms(room.ma_loai_phong);
      const availability = calcRoomAvailability(room, daDat);

      return {
        ...room,
        ...availability,
        loai_giuong: formatBedLabel(room),
        loai_phong_tien_nghi: tienNghi,
        hinh_anh: hinhAnh,
      };
    }));

    res.status(200).json({ success: true, data: roomsWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// api thêm mới
const MAX_ROOM_IMAGES = 30;

const pickRoomImageFiles = (req) => {
  const files = (req.files || []).filter((f) => f.fieldname === 'images');
  if (files.length > MAX_ROOM_IMAGES) {
    const err = new Error(`Chỉ được tải tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`);
    err.statusCode = 400;
    throw err;
  }
  return files;
};

const validateRoomFormData = (data) => {
  if (!data.ten_loai?.trim()) {
    return 'Vui lòng nhập tên loại phòng';
  }
  const dienTich = safeInt(data.dien_tich);
  if (!dienTich || dienTich < 10) return 'Diện tích phải từ 10 m² trở lên';
  const sucChua = safeInt(data.suc_chua);
  if (!sucChua || sucChua < 1) return 'Số người lớn phải từ 1 trở lên';
  const bedError = validateBedsByCapacity(sucChua, data);
  if (bedError) return bedError;
  const soPhong = safeInt(data.so_luong_phong);
  if (!soPhong || soPhong < 1) return 'Số lượng phòng phải từ 1 trở lên';
  const gia = safeFloat(data.gia_co_ban);
  if (!gia || gia < 100000) return 'Giá cơ bản phải từ 100.000đ trở lên';
  return null;
};

exports.createRoomType = async (req, res) => {
  try {
    const data = req.body;
    const validationError = validateRoomFormData(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    const tienNghi = parseJsonField(data.tien_nghi_ids, []);
    const files = pickRoomImageFiles(req);
    const hotelId = safeInt(data.ma_khach_san);

    const hotel = await prisma.khach_san.findUnique({
      where: { ma_khach_san: hotelId },
      select: { ma_khach_san: true },
    });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn' });
    }

    const soPhong = safeInt(data.so_luong_phong);
    const beds = parseBedCounts(data);

    const result = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.loai_phong.create({
        data: {
          ma_khach_san: hotelId,
          ten_loai: data.ten_loai,
          gia_co_ban: safeFloat(data.gia_co_ban),
          dien_tich: safeInt(data.dien_tich),
          suc_chua: safeInt(data.suc_chua),
          so_luong_phong: soPhong,
          so_luong_mo_ban: soPhong,
          so_giuong: beds.so_giuong,
          so_giuong_don: beds.so_giuong_don,
          so_giuong_doi: beds.so_giuong_doi,
          so_giuong_lon: beds.so_giuong_lon,
          mo_ta: data.mo_ta || '',
          trang_thai: 'hoat_dong',
          loai_phong_tien_nghi: {
            create: tienNghi.map((id) => ({ ma_tien_nghi: safeInt(id) })),
          },
        },
      });

      if (files.length > 0) {
        await tx.hinh_anh.createMany({
          data: files.map((file, idx) => ({
            loai_doi_tuong: 'loai_phong',
            ma_doi_tuong: newRoom.ma_loai_phong,
            url: `/uploads/${file.filename}`,
            la_anh_chinh: false,
            thu_tu: idx
          }))
        });
        await applyMainImage(tx, newRoom.ma_loai_phong, { mainNewIndex: data.mainNewIndex, files });
      }
      return newRoom;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// api cập nhật phòng
exports.updateRoomType = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const data = req.body;
    const validationError = validateRoomFormData(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    const files = pickRoomImageFiles(req);

    const existing = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: roomId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng' });
    }

    const soPhong = safeInt(data.so_luong_phong);
    const newMoBan = calcMoBanOnTotalChange(existing, soPhong);
    const beds = parseBedCounts(data);

    await prisma.$transaction(async (tx) => {
      await tx.loai_phong.update({
        where: { ma_loai_phong: roomId },
        data: {
          ten_loai: data.ten_loai,
          gia_co_ban: safeFloat(data.gia_co_ban),
          dien_tich: safeInt(data.dien_tich),
          suc_chua: safeInt(data.suc_chua),
          so_luong_phong: soPhong,
          so_luong_mo_ban: newMoBan,
          so_giuong: beds.so_giuong,
          so_giuong_don: beds.so_giuong_don,
          so_giuong_doi: beds.so_giuong_doi,
          so_giuong_lon: beds.so_giuong_lon,
          mo_ta: data.mo_ta,
        },
      });

      await tx.loai_phong_tien_nghi.deleteMany({ where: { ma_loai_phong: roomId } });
      const parsedTienNghi = parseJsonField(data.tien_nghi_ids, []);
      if (parsedTienNghi.length > 0) {
        await tx.loai_phong_tien_nghi.createMany({ data: parsedTienNghi.map(id => ({ ma_loai_phong: roomId, ma_tien_nghi: safeInt(id) })) });
      }

      const parsedRemoved = parseJsonField(data.removedImageIds, []);
      const removedIds = parsedRemoved.map(Number).filter((id) => !Number.isNaN(id));
      const remainingImages = await tx.hinh_anh.count({
        where: {
          loai_doi_tuong: 'loai_phong',
          ma_doi_tuong: roomId,
          ...(removedIds.length > 0 ? { ma_hinh_anh: { notIn: removedIds } } : {}),
        },
      });
      if (remainingImages + files.length > MAX_ROOM_IMAGES) {
        const err = new Error(`Tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`);
        err.statusCode = 400;
        throw err;
      }

      if (removedIds.length > 0) {
        await tx.hinh_anh.deleteMany({ where: { ma_hinh_anh: { in: removedIds } } });
      }

      if (files.length > 0) {
        await tx.hinh_anh.createMany({
          data: files.map((file, idx) => ({ loai_doi_tuong: 'loai_phong', ma_doi_tuong: roomId, url: `/uploads/${file.filename}`, la_anh_chinh: false, thu_tu: idx }))
        });
      }
      await applyMainImage(tx, roomId, { mainImageId: data.mainImageId, mainNewIndex: data.mainNewIndex, files });
    });

    res.status(200).json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// api bật / tắt hiển thị loại phòng
exports.toggleRoomStatus = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: roomId },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy loại phòng' });
    }

    if (room.trang_thai === 'hoat_dong') {
      const updated = await prisma.loai_phong.update({
        where: { ma_loai_phong: roomId },
        data: {
          trang_thai: 'an',
          khoa_do_doi_tac: true,
          so_luong_mo_ban_truoc_khoa: room.so_luong_mo_ban,
          so_luong_mo_ban: 0,
        },
      });
      return res.status(200).json({ success: true, data: updated });
    }

    if (isLockedByAdminRoom(room)) {
      return res.status(400).json({
        success: false,
        message: 'Loại phòng đang bị admin khóa. Bạn không thể mở khóa.',
      });
    }

    const moBan = Number(room.so_luong_mo_ban_truoc_khoa) > 0
      ? room.so_luong_mo_ban_truoc_khoa
      : (Number(room.so_luong_mo_ban) > 0 ? room.so_luong_mo_ban : room.so_luong_phong);

    const updated = await prisma.loai_phong.update({
      where: { ma_loai_phong: roomId },
      data: {
        trang_thai: 'hoat_dong',
        khoa_do_doi_tac: false,
        so_luong_mo_ban: moBan,
        so_luong_mo_ban_truoc_khoa: null,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// api lấy tiện nghi
exports.getAmenitiesForRoom = async (req, res) => {
  try {
    const amenities = await prisma.tien_nghi.findMany({
      where: {
        loai: { in: ['phong', 'ca_hai'] },
        trang_thai: 'hoat_dong',
      },
      orderBy: { ten: 'asc' },
    });
    res.status(200).json({ success: true, data: amenities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};