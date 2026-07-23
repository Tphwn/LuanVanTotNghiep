const analyticsService = require('./analytics.service');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getFinance = async (req, res, next) => {
  try {
    const data = await analyticsService.getFinance(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getBusiness = async (req, res, next) => {
  try {
    const data = await analyticsService.getBusiness(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getSystem = async (req, res, next) => {
  try {
    const data = await analyticsService.getSystem(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getHomeDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getHomeDashboard(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
