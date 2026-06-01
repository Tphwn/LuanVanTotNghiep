import Card from '../../components/common/Card';

const stats = [
  { label: 'Người dùng', value: 0, accent: '#7c3aed' },
  { label: 'Khách sạn', value: 0, accent: '#0ea5e9' },
  { label: 'Đặt phòng', value: 0, accent: '#14b8a6' },
  { label: 'Doanh thu', value: '0 VNĐ', accent: '#f97316' },
];

const quickActions = [
  { title: 'Phê duyệt khách sạn', subtitle: 'Kiểm tra hồ sơ mới' },
  { title: 'Quản lý tài khoản', subtitle: 'Xem thông tin admin và staff' },
  { title: 'Báo cáo tuần', subtitle: 'Theo dõi hiệu suất hệ thống' },
];

const DashboardPage = () => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Trang quản trị</p>
          <h1 style={{ margin: '10px 0 0', fontSize: '2.25rem', color: '#0f172a' }}>Xin chào Admin</h1>
        </div>
        <Card style={{ padding: '18px 24px', background: '#eff6ff' }}>
          <p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Tổng quan hệ thống</p>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>Quản lý toàn bộ dữ liệu và báo cáo tại đây.</p>
        </Card>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
        {stats.map((stat) => (
          <Card key={stat.label} style={{ padding: '24px', borderTop: `4px solid ${stat.accent}` }}>
            <p style={{ margin: 0, color: '#64748b', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em' }}>{stat.label}</p>
            <h2 style={{ margin: '18px 0 0', fontSize: '2rem', color: '#0f172a' }}>{stat.value}</h2>
          </Card>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.95rem' }}>Báo cáo quản trị</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Hiệu suất tuần này</h2>
            </div>
            <span style={{ padding: '8px 14px', background: '#e0f2fe', borderRadius: '9999px', color: '#0284c7', fontWeight: 600 }}>0%</span>
          </div>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>Theo dõi số liệu chính để đưa ra quyết định nhanh chóng. Xem các báo cáo quan trọng, yêu cầu phê duyệt và trạng thái hệ thống.</p>
        </Card>

        <Card style={{ padding: '28px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Hành động nhanh</h3>
          <p style={{ margin: '10px 0 22px', color: '#64748b' }}>Các mục cần thao tác ngay để giữ hệ thống ổn định.</p>
          <div style={{ display: 'grid', gap: '14px' }}>
            {quickActions.map((action) => (
              <button
                key={action.title}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>{action.title}</div>
                <div style={{ fontSize: '0.92rem', color: '#475569' }}>{action.subtitle}</div>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
