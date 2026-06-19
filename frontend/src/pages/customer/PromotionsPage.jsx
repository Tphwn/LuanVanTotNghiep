import { Link } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import '../../assets/styles/home.css';

const PROMOS = [
  {
    code: 'WELCOME10',
    title: 'Giảm 10% cho lần đặt đầu tiên',
    desc: 'Áp dụng cho mọi khách sạn đối tác trên hệ thống. Tối đa giảm 200.000 ₫/đơn.',
    badge: 'Mới',
    expiry: '31/12/2026',
  },
  {
    code: 'SUMMER26',
    title: 'Ưu đãi mùa hè — Giảm 15%',
    desc: 'Đặt phòng tại Vũng Tàu, Quy Nhơn, Đà Lạt từ tháng 6–8. Đơn tối thiểu 800.000 ₫.',
    badge: 'Hot',
    expiry: '31/08/2026',
  },
  {
    code: 'STAY3PAY2',
    title: 'Ở 3 đêm chỉ trả 2 đêm',
    desc: 'Áp dụng cho các khách sạn có nhãn ưu đãi dài ngày. Không áp dụng ngày lễ.',
    badge: 'Dài ngày',
    expiry: '30/09/2026',
  },
  {
    code: 'WEEKEND',
    title: 'Cuối tuần thả ga — Giảm 100.000 ₫',
    desc: 'Nhận phòng thứ 6, trả phòng Chủ nhật. Giảm trực tiếp vào tổng thanh toán.',
    badge: 'Cuối tuần',
    expiry: '31/12/2026',
  },
];

const PromotionsPage = () => (
  <div className="static-page">
    <div className="static-page-hero">
      <h1 className="static-page-title"> Ưu đãi & Khuyến mãi</h1>
      <p className="static-page-sub">
        Các chương trình giảm giá mới nhất — nhập mã khi đặt phòng để nhận ưu đãi.
      </p>
    </div>

    <div className="promo-grid">
      {PROMOS.map((p) => (
        <article key={p.code} className="promo-card">
          <div className="promo-card-top">
            <span className="promo-badge">{p.badge}</span>
            <span className="promo-code">{p.code}</span>
          </div>
          <h2 className="promo-card-title">{p.title}</h2>
          <p className="promo-card-desc">{p.desc}</p>
          <p className="promo-card-expiry">HSD: {p.expiry}</p>
        </article>
      ))}
    </div>

    <div className="static-page-cta content-card">
      <p>Sẵn sàng đặt phòng với ưu đãi?</p>
      <Link to={ROUTES.HOME} className="btn btn-primary">Tìm khách sạn ngay</Link>
    </div>
  </div>
);

export default PromotionsPage;
