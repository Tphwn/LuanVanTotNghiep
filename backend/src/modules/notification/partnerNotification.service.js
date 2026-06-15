const prisma = require('../../config/prisma');

const getPartnerUserId = async (userId) => {
  const doiTac = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
    select: { ma_doi_tac: true },
  });
  return doiTac?.ma_doi_tac;
};

const listNotifications = async (userId, { loai } = {}) => {
  const where = { ma_nguoi_dung: parseInt(userId) };
  if (loai) where.loai = loai;

  const [items, unreadCount] = await Promise.all([
    prisma.thong_bao.findMany({
      where,
      orderBy: { ngay_gui: 'desc' },
      take: 50,
    }),
    prisma.thong_bao.count({
      where: { ...where, da_doc: false },
    }),
  ]);

  return { items, unreadCount };
};

const markRead = async (userId, id) => {
  const item = await prisma.thong_bao.findFirst({
    where: { ma_thong_bao: Number(id), ma_nguoi_dung: parseInt(userId) },
  });
  if (!item) throw new Error('Không tìm thấy thông báo');

  return prisma.thong_bao.update({
    where: { ma_thong_bao: item.ma_thong_bao },
    data: { da_doc: true },
  });
};

const markAllRead = async (userId, loai) => {
  const where = { ma_nguoi_dung: parseInt(userId), da_doc: false };
  if (loai) where.loai = loai;

  await prisma.thong_bao.updateMany({
    where,
    data: { da_doc: true },
  });

  return { success: true };
};

const listMyAmenityRequests = async (userId) => {
  const maDoiTac = await getPartnerUserId(userId);
  if (!maDoiTac) throw new Error('Không tìm thấy hồ sơ đối tác');

  return prisma.yeu_cau_tien_nghi.findMany({
    where: { ma_doi_tac: maDoiTac },
    orderBy: { ngay_yeu_cau: 'desc' },
    include: {
      tien_nghi: { select: { ten: true, loai: true, bieu_tuong: true } },
    },
  });
};

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
  listMyAmenityRequests,
};
