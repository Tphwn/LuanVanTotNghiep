const inventoryService = require('./inventory.service');
const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
    select: { ma_doi_tac: true },
  });
  return dt?.ma_doi_tac;
};

exports.getHotels = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await inventoryService.getHotels(doiTacId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await inventoryService.getInventory(doiTacId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOpenSale = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await inventoryService.updateOpenSale(
      req.params.id,
      req.body.so_luong_mo_ban,
      doiTacId
    );
    res.json({ success: true, data, message: 'Đã cập nhật số lượng mở bán' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.closeSale = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await inventoryService.closeSale(req.params.id, doiTacId);
    res.json({ success: true, data, message: 'Đã đóng bán loại phòng này' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.reopenSale = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    const data = await inventoryService.reopenSale(req.params.id, doiTacId);
    res.json({ success: true, data, message: 'Đã mở bán lại' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
