import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import ROUTES from '../../constants/routes';
import { resolveUploadUrl } from '../../utils/media';

const FooterNavItem = ({ to, children }) => {
  if (to) {
    return (
      <Link to={to} className="site-footer-link">
        {children}
      </Link>
    );
  }
  return <span className="site-footer-text">{children}</span>;
};

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-grid">
        <div className="site-footer-col site-footer-col--brand">
          <div className="site-footer-logo">
            <img
              src={resolveUploadUrl('/uploads/logofooter.png')}
              alt="Hotel Booking"
            />
          </div>
          <ul className="site-footer-contact">
            <li>
              <MapPin size={16} strokeWidth={1.75} aria-hidden />
              <span>Địa chỉ: 180 Cao Lỗ, Phường Chánh Hưng, TP. Hồ Chí Minh</span>
            </li>
            <li>
              <Phone size={16} strokeWidth={1.75} aria-hidden />
              <span>
                Hotline hỗ trợ:
                {' '}
                <a href="tel:0777443088" className="site-footer-link">0777443088</a>
              </span>
            </li>
            <li>
              <Mail size={16} strokeWidth={1.75} aria-hidden />
              <span>
                Email:
                {' '}
                <a href="mailto:adminhotelbooking@gmail.com" className="site-footer-link">
                  adminhotelbooking@gmail.com
                </a>
              </span>
            </li>
          </ul>
        </div>

        <div className="site-footer-col">
          <h3 className="site-footer-heading">Hỗ trợ khách hàng</h3>
          <ul className="site-footer-nav">
            <li>
              <FooterNavItem to={ROUTES.CUSTOMER.BOOKING_GUIDE}>
                Hướng dẫn đặt phòng
              </FooterNavItem>
            </li>
            <li>
              <FooterNavItem to={ROUTES.CUSTOMER.CONTACT}>
                Câu hỏi thường gặp
              </FooterNavItem>
            </li>
            <li>
              <FooterNavItem>Về chúng tôi</FooterNavItem>
            </li>
          </ul>
        </div>

        <div className="site-footer-col">
          <h3 className="site-footer-heading">Đối tác</h3>
          <ul className="site-footer-nav">
            <li>
              <FooterNavItem to={ROUTES.CUSTOMER.PARTNER_CONTACT}>
                Đăng ký hợp tác
              </FooterNavItem>
            </li>
            <li>
              <FooterNavItem>Quy chế hoạt động sàn</FooterNavItem>
            </li>
            <li>
              <FooterNavItem>Chính sách hoa hồng và thanh toán</FooterNavItem>
            </li>
          </ul>
        </div>

        <div className="site-footer-col">
          <h3 className="site-footer-heading">Pháp lý</h3>
          <ul className="site-footer-nav">
            <li>
              <FooterNavItem>Điều khoản sử dụng</FooterNavItem>
            </li>
            <li>
              <FooterNavItem>Chính sách bảo mật</FooterNavItem>
            </li>
            <li>
              <FooterNavItem>Danh sách điểm đến phổ biến</FooterNavItem>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        {new Date().getFullYear()}
        {' '}
        Hotel Booking — Nền tảng đặt phòng khách sạn
      </div>
    </div>
  </footer>
);

export default SiteFooter;
