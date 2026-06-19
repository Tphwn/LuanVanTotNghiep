const prisma = require('../config/prisma');

const fetchImages = async (loaiDoiTuong, ids) => {
  if (!ids.length) return {};
  const images = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: loaiDoiTuong, ma_doi_tuong: { in: ids } },
    orderBy: { thu_tu: 'asc' },
  });
  return images.reduce((acc, img) => {
    if (!acc[img.ma_doi_tuong]) acc[img.ma_doi_tuong] = [];
    acc[img.ma_doi_tuong].push(img);
    return acc;
  }, {});
};

const attachHotelImages = async (hotels) => {
  const ids = hotels.map((h) => h.ma_khach_san);
  if (!ids.length) return hotels.map((h) => ({ ...h, hinh_anh: [] }));
  const byHotel = await fetchImages('khach_san', ids);
  return hotels.map((h) => ({ ...h, hinh_anh: byHotel[h.ma_khach_san] || [] }));
};

const attachRoomImages = async (rooms) => {
  const ids = rooms.map((r) => r.ma_loai_phong);
  if (!ids.length) return rooms.map((r) => ({ ...r, hinh_anh: [] }));
  const byRoom = await fetchImages('loai_phong', ids);
  return rooms.map((r) => ({ ...r, hinh_anh: byRoom[r.ma_loai_phong] || [] }));
};

module.exports = {
  fetchImages,
  attachHotelImages,
  attachRoomImages,
};
