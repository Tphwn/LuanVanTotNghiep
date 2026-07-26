import { useState } from 'react';
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
const CONTACT_CARDS = [
  {
    id: 'phone',
    icon: Phone,
    badge: 'Tổng đài hỗ trợ',
    title: 'Chăm sóc khách hàng',
    primary: '0777443088',
    primaryHref: 'tel:0777443088',
    note: 'Thời gian hỗ trợ: 8h00 - 22h00 mỗi ngày',
  },
  {
    id: 'email',
    icon: Mail,
    badge: 'Hỗ trợ qua Email',
    title: 'Gửi yêu cầu chi tiết',
    primary: 'adminhotelbooking@gmail.com',
    primaryHref: 'mailto:adminhotelbooking@gmail.com',
    note: 'Đội ngũ sẽ phản hồi trong vòng 24h làm việc',
  },
  {
    id: 'address',
    icon: MapPin,
    badge: 'Trụ sở văn phòng',
    title: 'Địa chỉ giao dịch',
    primary: '180 Cao Lỗ, Phường Chánh Hưng, TP. Hồ Chí Minh',
    primaryHref: null,
    note: 'Chỉ tiếp nhận Đối tác đến làm việc trực tiếp',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Tôi có thể hủy phòng và được hoàn tiền không?',
    a: 'Chính sách hoàn hủy phụ thuộc vào từng khách sạn cụ thể mà bạn đặt. Quý khách vui lòng kiểm tra kỹ mục Chính sách hủy phòng trong chi tiết đơn đặt phòng trước khi tiến hành thanh toán.',
  },
  {
    q: 'Làm sao để biết tôi đã đặt phòng thành công?',
    a: 'Sau khi thanh toán thành công, hệ thống sẽ lập tức hiển thị mã đơn hàng (ví dụ DH123456) và trạng thái đơn sẽ chuyển sang Hoàn thành. Bạn cũng có thể theo dõi trong mục Quản lý đặt phòng.',
  },
  {
    q: 'Tôi muốn xuất hóa đơn VAT thì làm thế nào?',
    a: 'Nền tảng của chúng tôi là cầu nối trung gian. Để lấy hóa đơn VAT tiền phòng, quý khách vui lòng thông báo và cung cấp thông tin xuất hóa đơn trực tiếp cho quầy lễ tân khách sạn khi đến Check-in.',
  },
  {
    q: 'Tôi là chủ khách sạn và muốn đăng bán phòng trên hệ thống?',
    a: 'Chào mừng bạn! Để trở thành đối tác, vui lòng gọi trực tiếp vào Tổng đài hỗ trợ ở trên, hoặc gửi thông tin cơ sở lưu trú của bạn qua email để bộ phận phát triển đối tác liên hệ lại.',
  },
];

const ContactPage = () => {
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="static-page contact-page">
      <div className="static-page-hero">
        <h1 className="static-page-title">Liên hệ với chúng tôi</h1>
        <p className="static-page-sub">
          Đội ngũ Hotel Booking luôn sẵn sàng hỗ trợ bạn về đặt phòng, thanh toán và dịch vụ.
        </p>
      </div>

      <section className="contact-cards-section" aria-label="Thông tin liên hệ">
        <div className="contact-cards-grid">
          {CONTACT_CARDS.map((card) => {
            const Icon = card.icon;
            const PrimaryTag = card.primaryHref ? 'a' : 'p';
            const primaryProps = card.primaryHref
              ? { href: card.primaryHref, className: 'contact-card-primary contact-card-primary--link' }
              : { className: 'contact-card-primary' };

            return (
              <article key={card.id} className="contact-info-card">
                <div className="contact-card-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <p className="contact-card-badge">{card.badge}</p>
                <h2 className="contact-card-title">{card.title}</h2>
                <div className="contact-card-primary-wrap">
                  <PrimaryTag {...primaryProps}>{card.primary}</PrimaryTag>
                </div>
                <p className="contact-card-note">{card.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="contact-faq-section" aria-label="Câu hỏi thường gặp">
        <div className="contact-faq-header">
          <h2 className="contact-faq-heading">Câu hỏi thường gặp</h2>
          <p className="contact-faq-sub">
            Một số thắc mắc phổ biến khi đặt phòng qua nền tảng trung gian Hotel Booking
          </p>
        </div>

        <div className="contact-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={item.q}
                className={`contact-faq-item${isOpen ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="contact-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={20} strokeWidth={2} className="contact-faq-chevron" aria-hidden />
                </button>
                {isOpen && (
                  <div className="contact-faq-panel">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
