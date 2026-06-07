// Trang tổng quan admin — hiển thị số liệu thống kê toàn hệ thống
const DashboardPage = () => {
  const stats = [
    { label: 'Người dùng',  value: '0',      sub: 'Tổng tài khoản',    color: '#3C7363' },
    { label: 'Khách sạn',   value: '0',      sub: 'Đã được duyệt',     color: '#0958d9' },
    { label: 'Đặt phòng',   value: '0',      sub: 'Tháng này',         color: '#b36b00' },
    { label: 'Doanh thu',   value: '0 ₫',    sub: 'Tháng này',         color: '#1a7a4a' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tổng quan hệ thống</h1>
        <p className="page-subtitle">Theo dõi toàn bộ hoạt động của hệ thống tại đây</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}
            style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bảng khách sạn chờ duyệt */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">🏨 Khách sạn chờ duyệt</h3>
          <span className="badge badge-warning">0 chờ xử lý</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên khách sạn</th>
              <th>Đối tác</th>
              <th>Địa điểm</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#5a7a72', padding: '32px' }}>
                Không có dữ liệu
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bảng đặt phòng gần đây */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">📅 Đặt phòng gần đây</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Khách sạn</th>
              <th>Check-in</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#5a7a72', padding: '32px' }}>
                Không có dữ liệu
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;