import Card from '../../components/common/Card';

const stats = [
  { label: 'Tổng khách sạn', value: 0, accent: '#117d62' },
  { label: 'Tổng phòng', value: 0, accent: '#f59e0b' },
  { label: 'Đơn đặt phòng', value: 0, accent: '#0ea5e9' },
];

const topCards = [
  { title: 'Doanh thu tháng', amount: '0 đ', subtitle: 'Cập nhật mới nhất' },
  { title: 'Yêu cầu mới', amount: '0', subtitle: 'Đang chờ xử lý' },
];

const PartnerDashboardPage = () => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Bảng điều khiển đối tác</p>
            <h1 style={{ margin: '10px 0 6px', fontSize: '2.25rem', color: '#0f172a' }}>Xin chào đối tác</h1>
            <p style={{ margin: 0, color: '#475569', maxWidth: '680px', lineHeight: 1.7 }}>
              Đánh giá hiệu suất khách sạn và quản lý đơn đặt phòng một cách nhanh chóng. Xem tổng quan doanh thu, khách sạn và các yêu cầu mới trong một màn hình duy nhất.
            </p>
          </div>

          <Card style={{ minWidth: '260px', background: '#0f172a', color: '#fff', padding: '20px 24px' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>Tình trạng hoạt động</p>
            <h2 style={{ margin: '14px 0 6px', fontSize: '1.75rem' }}>Ổn định</h2>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>Hệ thống đang hoạt động bình thường. Không có vấn đề nào cần xử lý ngay.</p>
          </Card>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        {stats.map((item) => (
          <Card key={item.label} style={{ padding: '24px', borderTop: `4px solid ${item.accent}` }}>
            <p style={{ margin: 0, color: '#64748b', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.08em' }}>{item.label}</p>
            <h2 style={{ margin: '16px 0 0', fontSize: '2rem', color: '#0f172a' }}>{item.value}</h2>
          </Card>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Cập nhật nhanh</p>
              <h2 style={{ margin: '8px 0 0', fontSize: '1.4rem', color: '#0f172a' }}>Hiệu suất tháng này</h2>
            </div>
            <span style={{ padding: '8px 14px', background: '#e2e8f0', borderRadius: '9999px', fontSize: '0.9rem', color: '#334155' }}>0%</span>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {topCards.map((card) => (
              <div key={card.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: '#f8fafc', borderRadius: '18px' }}>
                <div>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>{card.title}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{card.amount}</p>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{card.subtitle}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '28px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Hành động nhanh</h3>
          <p style={{ margin: '10px 0 22px', color: '#64748b' }}>Truy cập ngay các phần quan trọng để quản lý khách sạn và đặt phòng.</p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <button style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: 'none', background: '#117d62', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Quản lý khách sạn</button>
            <button style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>Xem đặt phòng</button>
            <button style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>Thiết lập tiện nghi</button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default PartnerDashboardPage;
