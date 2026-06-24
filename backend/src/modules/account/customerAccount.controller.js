const service = require('./customerAccount.service');

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
    const data = await service.updateProfile(req.user.id, req.body, avatarUrl);
    res.json({ success: true, data, message: 'Cập nhật thông tin thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const mat_khau_cu = req.body.mat_khau_cu?.trim();
    const mat_khau_moi = req.body.mat_khau_moi?.trim();
    const xac_nhan_mat_khau = req.body.xac_nhan_mat_khau?.trim();

    if (!mat_khau_cu || !mat_khau_moi || !xac_nhan_mat_khau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu' });
    }
    if (mat_khau_moi.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    if (mat_khau_moi !== xac_nhan_mat_khau) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu không khớp' });
    }
    if (mat_khau_cu === mat_khau_moi) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }
    const result = await service.changePassword(req.user.id, { mat_khau_cu, mat_khau_moi });
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.changePhone = async (req, res) => {
  try {
    const { so_dien_thoai } = req.body;
    const data = await service.changePhone(req.user.id, so_dien_thoai);
    res.json({ success: true, data, message: 'Đổi số điện thoại thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
