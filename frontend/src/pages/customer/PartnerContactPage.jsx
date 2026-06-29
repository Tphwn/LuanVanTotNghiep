import { useState } from 'react';
import partnerContactService from '../../services/partnerContactService';
import '../../assets/styles/partner-contact.css';

const INITIAL_FORM = {
  fullName: '',
  phone: '',
  email: '',
  hotelName: '',
  city: '',
  scale: 'Dưới 10 phòng',
  notes: '',
};

const PartnerContactPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await partnerContactService.submitRequest({
        ho_ten: formData.fullName.trim(),
        so_dien_thoai: formData.phone.trim(),
        email: formData.email.trim(),
        ten_co_so: formData.hotelName.trim(),
        quy_mo: formData.scale,
        tinh_thanh: formData.city.trim(),
        ghi_chu: formData.notes.trim() || undefined,
      });
      setSent(true);
      setFormData(INITIAL_FORM);
    } catch (err) {
      const data = err.response?.data;
      const fieldErrors = data?.errors;
      let msg = data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.';
      if (fieldErrors && typeof fieldErrors === 'object') {
        msg = Object.values(fieldErrors)[0] || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-wrapper">
      <div className="partner-header">
        <h1>Hợp tác cùng Hotel Booking</h1>
        <p>Mở rộng tập khách hàng và tối ưu hóa doanh thu cho cơ sở lưu trú của bạn</p>
      </div>

      <h2 className="section-title">1. Lợi ích nổi bật</h2>
      <div className="benefits-container">
        <div className="benefit-card">
          <div className="benefit-icon"></div>
          <h3>Tăng Công Suất Phòng</h3>
          <p>Tiếp cận hàng ngàn khách hàng tiềm năng truy cập nền tảng mỗi ngày.</p>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon"></div>
          <h3>Quản Lý Thông Minh</h3>
          <p>Hệ thống quản lý phòng, giá cả và đánh giá trực quan, dễ sử dụng.</p>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon"></div>
          <h3>Chi Phí Minh Bạch</h3>
          <p>Chỉ thu hoa hồng khi có đơn hàng thành công. Hỗ trợ đối tác 24/7.</p>
        </div>
      </div>

      <h2 className="section-title">2. Quy trình 4 bước đơn giản</h2>
      <div className="steps-container">
        <div className="step-item">
          <div className="step-circle">1</div>
          <h4>Gửi thông tin</h4>
          <p>Điền form bên dưới</p>
        </div>
        <div className="step-item">
          <div className="step-circle">2</div>
          <h4>Tư vấn</h4>
          <p>Admin liên hệ đàm phán</p>
        </div>
        <div className="step-item">
          <div className="step-circle">3</div>
          <h4>Ký hợp đồng</h4>
          <p>Cấp tài khoản hệ thống</p>
        </div>
        <div className="step-item">
          <div className="step-circle">4</div>
          <h4>Đón khách</h4>
          <p>Bắt đầu nhận booking</p>
        </div>
      </div>

      <h2 className="section-title section-title--center">Đăng Ký Hợp Tác Ngay</h2>
      <div className="form-container">
        {sent ? (
          <div className="partner-success">
            <p>Cảm ơn bạn! Yêu cầu hợp tác đã được gửi thành công.</p>
            <p>Đội ngũ phát triển đối tác sẽ liên hệ trong vòng 24 giờ làm việc.</p>
            <button
              type="button"
              className="submit-btn submit-btn--inline"
              onClick={() => setSent(false)}
            >
              Gửi yêu cầu khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="form-group-title">Thông tin người đại diện</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên *</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="0909xxxxxx"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">Email liên hệ *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="email@domain.com"
                  required
                />
              </div>
            </div>

            <h3 className="form-group-title">Thông tin cơ sở lưu trú</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hotelName">Tên Khách sạn/Homestay *</label>
                <input
                  id="hotelName"
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="VD: Canary Gold"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="scale">Quy mô số phòng</label>
                <select
                  id="scale"
                  name="scale"
                  value={formData.scale}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="Dưới 10 phòng">Dưới 10 phòng</option>
                  <option value="10 - 30 phòng">Từ 10 - 30 phòng</option>
                  <option value="Trên 30 phòng">Trên 30 phòng</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="city">Tỉnh / Thành phố *</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="VD: Đà Lạt"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Ghi chú thêm (Tùy chọn)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="4"
                  placeholder="Nhập câu hỏi hoặc yêu cầu cụ thể của bạn..."
                />
              </div>

              {error && <p className="form-error full-width">{error}</p>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU HỢP TÁC'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="contact-footer">
        <h3>Cam Kết Của Chúng Tôi</h3>
        <p>Đội ngũ phát triển đối tác sẽ xem xét thông tin và liên hệ lại với bạn trong vòng 24 giờ làm việc.</p>
        <p>
          Hotline hỗ trợ: <strong>0777443085</strong>
          {' | '}
          Email: <strong>Hotelbooking@gmail.com</strong>
        </p>
      </div>
    </div>
  );
};

export default PartnerContactPage;
