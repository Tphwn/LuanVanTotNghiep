import { useState } from 'react';
import '../../assets/styles/home.css';

const ContactPage = () => {
  const [form, setForm] = useState({ ho_ten: '', email: '', noi_dung: ''});
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="static-page">
      <div className="static-page-hero">
        <h1 className="static-page-title"> Liên hệ với chúng tôi</h1>
        <p className="static-page-sub">
          Đội ngũ Hotel Booking luôn sẵn sàng hỗ trợ bạn 24/7 về đặt phòng, thanh toán và dịch vụ.
        </p>
      </div>

      <div className="contact-layout">
        <div className="contact-info content-card">
          <h3 className="content-card-title">Thông tin liên hệ</h3>
          <ul className="contact-list">
            <li>
              <div>
                <strong>Địa chỉ</strong>
                <p>180, Cao Lỗ, TP. Hồ Chí Minh</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Hotline</strong>
                <p>1900 1234 (8:00 – 22:00 hàng ngày)</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Email</strong>
                <p>support@hotelbooking.vn</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Mạng xã hội</strong>
                <p>Facebook · Zalo · Instagram</p>
              </div>
            </li>
          </ul>
        </div>

        <form className="contact-form content-card"onSubmit={handleSubmit}>
          <h3 className="content-card-title">Gửi tin nhắn</h3>

          {sent ? (
            <div className="contact-success">
              <div style={{ fontSize: 40, marginBottom: 12 }}></div>
              <p>Cảm ơn bạn! Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
            </div>
          ) : (
            <>
              <div className="booking-field">
                <label className="booking-label"htmlFor="contact-name">Họ và tên</label>
                <input
                  id="contact-name"className="booking-input"value={form.ho_ten}
                  onChange={(e) => setForm((p) => ({ ...p, ho_ten: e.target.value }))}
                  required
                />
              </div>
              <div className="booking-field">
                <label className="booking-label"htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"type="email"className="booking-input"value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="booking-field">
                <label className="booking-label"htmlFor="contact-msg">Nội dung</label>
                <textarea
                  id="contact-msg"className="booking-textarea"rows={4}
                  value={form.noi_dung}
                  onChange={(e) => setForm((p) => ({ ...p, noi_dung: e.target.value }))}
                  required
                  placeholder="Mô tả yêu cầu hoặc thắc mắc của bạn..."/>
              </div>
              <button type="submit"className="btn btn-primary" style={{ width:'100%' }}>
                Gửi liên hệ
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
