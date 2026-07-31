import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import partnerContactService from '../../services/partnerContactService';
import publicHotelService from '../../services/publicHotelService';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { validateEmail, validatePhone, sanitizePhoneInput } from '../../utils/authValidation';
import { resolveUploadUrl } from '../../utils/media';
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

const SCALE_OPTIONS = ['Dưới 10 phòng', '10 - 30 phòng', 'Trên 30 phòng'];
const FALLBACK_CITIES = ['Đà Lạt', 'Quy Nhơn', 'Vũng Tàu'];

const FIELD_KEY_MAP = {
  ho_ten: 'fullName',
  so_dien_thoai: 'phone',
  email: 'email',
  ten_co_so: 'hotelName',
  quy_mo: 'scale',
  tinh_thanh: 'city',
  ghi_chu: 'notes',
};

const PartnerContactPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [cities, setCities] = useState(FALLBACK_CITIES);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sent, setSent] = useState(false);
  const { toast, showToast } = useToast();
  const logoUrl = resolveUploadUrl('/uploads/logo.png');

  useEffect(() => {
    let mounted = true;
    publicHotelService.getLocations()
      .then((res) => {
        const list = (res.data?.data || [])
          .map((loc) => loc.ten_dia_diem)
          .filter(Boolean);
        if (mounted && list.length) setCities(list);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? sanitizePhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const fullName = formData.fullName.trim();
    const hotelName = formData.hotelName.trim();
    const city = formData.city.trim();
    const notes = formData.notes.trim();

    if (!fullName) {
      errors.fullName = 'Họ và tên không được để trống.';
    } else if (fullName.length < 2) {
      errors.fullName = 'Họ và tên tối thiểu 2 ký tự.';
    } else if (fullName.length > 30) {
      errors.fullName = 'Họ và tên tối đa 30 ký tự.';
    }

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    if (!hotelName) {
      errors.hotelName = 'Tên khách sạn/homestay không được để trống.';
    } else if (hotelName.length < 2) {
      errors.hotelName = 'Tên cơ sở tối thiểu 2 ký tự.';
    } else if (hotelName.length > 150) {
      errors.hotelName = 'Tên cơ sở tối đa 150 ký tự.';
    }

    if (!formData.scale || !SCALE_OPTIONS.includes(formData.scale)) {
      errors.scale = 'Vui lòng chọn quy mô số phòng.';
    }

    if (!city) {
      errors.city = 'Vui lòng chọn Tỉnh / Thành phố.';
    } else if (!cities.includes(city)) {
      errors.city = 'Tỉnh / Thành phố không hợp lệ.';
    }

    if (notes.length > 500) {
      errors.notes = 'Ghi chú tối đa 500 ký tự.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Gửi yêu cầu không thành công. Vui lòng điền đầy đủ và đúng thông tin.', 'error');
      return;
    }

    setFieldErrors({});
    setLoading(true);

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
      showToast('Gửi yêu cầu hợp tác thành công');
    } catch (err) {
      const data = err.response?.data;
      const serverErrors = data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const mapped = {};
        Object.entries(serverErrors).forEach(([key, message]) => {
          const feKey = FIELD_KEY_MAP[key] || key;
          mapped[feKey] = message;
        });
        setFieldErrors(mapped);
      }
      showToast(
        data?.message || 'Gửi yêu cầu không thành công. Vui lòng kiểm tra lại thông tin.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFieldError = (name) => (
    fieldErrors[name] ? <p className="form-field-error">{fieldErrors[name]}</p> : null
  );

  return (
    <div className="partner-wrapper">
      <Toast toast={toast} />

      <section className="partner-hero">
        <div className="partner-hero-content">
          <img
            src={logoUrl}
            alt="Hotel Booking"
            className="partner-hero-logo"
          />
          <h1>Hợp tác cùng Hotel Booking</h1>
          <p>Mở rộng tập khách hàng và tối ưu hóa doanh thu cho cơ sở lưu trú của bạn</p>
        </div>
      </section>

      <h2 className="section-title">1. Lợi ích nổi bật</h2>
      <div className="benefits-container">
        <div className="benefit-card">
          <div className="benefit-icon" />
          <h3>Tăng Công Suất Phòng</h3>
          <p>Tiếp cận hàng ngàn khách hàng tiềm năng truy cập nền tảng mỗi ngày.</p>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon" />
          <h3>Quản Lý Thông Minh</h3>
          <p>Hệ thống quản lý phòng, giá cả và đánh giá trực quan, dễ sử dụng.</p>
        </div>
        <div className="benefit-card">
          <div className="benefit-icon" />
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

      <div className="partner-form-card">
        <h2 className="partner-form-card-title">Đăng Ký Hợp Tác Ngay</h2>
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
          <form onSubmit={handleSubmit} noValidate>
            <h3 className="form-group-title">Thông tin người đại diện</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">
                  Họ và tên
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.fullName ? ' input-invalid' : ''}`}
                  placeholder="VD: Nguyễn Văn A"
                />
                {renderFieldError('fullName')}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Số điện thoại
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.phone ? ' input-invalid' : ''}`}
                  placeholder="0909xxxxxx"
                />
                {renderFieldError('phone')}
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">
                  Email liên hệ
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.email ? ' input-invalid' : ''}`}
                  placeholder="email@domain.com"
                />
                {renderFieldError('email')}
              </div>
            </div>

            <h3 className="form-group-title">Thông tin cơ sở lưu trú</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hotelName">
                  Tên Khách sạn/Homestay
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <input
                  id="hotelName"
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.hotelName ? ' input-invalid' : ''}`}
                  placeholder="VD: Canary Gold"
                />
                {renderFieldError('hotelName')}
              </div>

              <div className="form-group">
                <label htmlFor="scale">
                  Quy mô số phòng
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <select
                  id="scale"
                  name="scale"
                  value={formData.scale}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.scale ? ' input-invalid' : ''}`}
                >
                  {SCALE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {renderFieldError('scale')}
              </div>

              <div className="form-group full-width">
                <label htmlFor="city">
                  Tỉnh / Thành phố
                  {' '}
                  <span className="form-required" aria-hidden>*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.city ? ' input-invalid' : ''}`}
                >
                  <option value="">-- Chọn tỉnh / thành phố --</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {renderFieldError('city')}
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Ghi chú thêm (Tùy chọn)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className={`form-control${fieldErrors.notes ? ' input-invalid' : ''}`}
                  rows="4"
                  placeholder="Nhập câu hỏi hoặc yêu cầu cụ thể của bạn..."
                />
                {renderFieldError('notes')}
              </div>
            </div>

            <div className="submit-btn-wrap">
              <button type="submit" className="submit-btn" disabled={loading}>
                <Send size={18} strokeWidth={2.25} aria-hidden />
                {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU HỢP TÁC'}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

export default PartnerContactPage;
