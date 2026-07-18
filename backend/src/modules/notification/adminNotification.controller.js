const service = require('./adminNotification.service');

exports.getNotifications = async (req, res) => {
  try {
    const loai = req.query.loai || undefined;
    const data = await service.listNotifications(req.user.id, { loai });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const data = await service.markRead(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const data = await service.markAllRead(req.user.id, req.query.loai);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
