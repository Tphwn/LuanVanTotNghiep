const service = require('./customerAccount.service');
const {
  validatePhone,
  validateChangePassword,
} = require('../../utils/authValidation');

exports.getProfile = async (req, res) => {
  try {
    const data = await service.getCustomerProfile(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    if (req.body.so_dien_thoai !== undefined) {
      const phoneErr = validatePhone(req.body.so_dien_thoai);
      if (phoneErr) {
        return res.status(400).json({ success: false, message: phoneErr });
      }
      req.body.so_dien_thoai = String(req.body.so_dien_thoai).trim();
    }

    const data = await service.updateProfile(req.user.id, req.body, avatarUrl);
    res.json({ success: true, data, message: 'Cập nhật thông tin thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const mat_khau_cu = typeof req.body.mat_khau_cu === 'string' ? req.body.mat_khau_cu : '';
    const mat_khau_moi = typeof req.body.mat_khau_moi === 'string' ? req.body.mat_khau_moi : '';
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

    const result = await service.changePassword(req.user.id, { mat_khau_cu, mat_khau_moi });
    res.json({ success: true, message: result.message });
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
