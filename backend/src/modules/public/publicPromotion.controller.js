const publicPromotionService = require('./publicPromotion.service');
const { success } = require('../../utils/response');

exports.getSystemPromotions = async (req, res, next) => {
  try {
    const data = await publicPromotionService.getSystemPromotions();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getHotelPromotions = async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    if (Number.isNaN(hotelId)) {
      return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ' });
    }
    const data = await publicPromotionService.getHotelPromotions(hotelId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};
