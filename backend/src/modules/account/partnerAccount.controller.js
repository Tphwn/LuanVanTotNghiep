const service = require('./partnerAccount.service');
const {
  validatePhone,
  validateChangePassword,
} = require('../../utils/authValidation');
const { validateBankAccount } = require('../../utils/bankAccountHelpers');

exports.getProfile = async (req, res) => {
  try {
    const data = await service.getPartnerProfile(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const phone = req.body.so_dien_thoai;
    if (phone !== undefined) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        return res.status(400).json({ success: false, message: phoneErr });
      }
      req.body.so_dien_thoai = String(phone).trim();
    }

    const data = await service.updateProfile(req.user.id, req.body, avatarUrl);
    res.json({ success: true, data, message: 'Cập nhật thông tin thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listBanks = async (req, res) => {
  try {
    const data = await service.listBanks();
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Không tải được danh sách ngân hàng',
    });
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const payload = {
      so_tai_khoan: req.body.so_tai_khoan,
      ten_chu_tai_khoan: req.body.ten_chu_tai_khoan,
      ma_ngan_hang: req.body.ma_ngan_hang,
    };
    const validationError = validateBankAccount(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const data = await service.updateBankAccount(req.user.id, payload);
    res.json({
      success: true,
      data,
      message: 'Cập nhật tài khoản ngân hàng thành công',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Cập nhật tài khoản ngân hàng thất bại',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const mat_khau_cu = typeof req.body.mat_khau_cu === 'string'
      ? req.body.mat_khau_cu
      : '';
    const mat_khau_moi = typeof req.body.mat_khau_moi === 'string'
      ? req.body.mat_khau_moi
      : '';
    const xac_nhan_mat_khau = typeof req.body.xac_nhan_mat_khau === 'string'
      ? req.body.xac_nhan_mat_khau
      : '';

    const validationError = validateChangePassword({
      mat_khau_cu,
      mat_khau_moi,
      xac_nhan_mat_khau,
    });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const userId = parseInt(req.user.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ' });
    }

    const result = await service.changePassword(userId, { mat_khau_cu, mat_khau_moi });
    res.json({ success: true, message: result.message || 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Đổi mật khẩu không thành công, nhập lại',
    });
  }
};

exports.changePhone = async (req, res) => {
  try {
    const phoneErr = validatePhone(req.body.so_dien_thoai);
    if (phoneErr) {
      return res.status(400).json({ success: false, message: phoneErr });
    }
    const data = await service.changePhone(req.user.id, String(req.body.so_dien_thoai).trim());
    res.json({ success: true, data, message: 'Đổi số điện thoại thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
