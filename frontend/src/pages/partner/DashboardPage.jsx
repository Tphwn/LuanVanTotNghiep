// Trang tổng quan đối tác — hiển thị số liệu khách sạn, phòng, booking của riêng đối tác
const PartnerDashboardPage = () => {
  const stats = [
    { label: 'Khách sạn',    value: '0', sub: 'Đang hoạt động',  color: '#3C7363'},
    { label:'Loại phòng',   value: '0', sub: 'Tổng loại phòng', color: '#0958d9'},
    { label:'Đặt phòng',    value: '0', sub: 'Tháng này',       color: '#b36b00'},
    { label:'Doanh thu',    value: '0 ₫', sub: 'Tháng này',     color: '#1a7a4a'},
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tổng Quan</h1>
        <p className="page-subtitle">Quản lý khách sạn và đơn đặt phòng của bạn</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card"key={s.label}
            style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value"style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title"> Đặt phòng mới nhất</h3>
          <span className="badge badge-info">0 đơn mới</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Loại phòng</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} style={{ textAlign:'center', color: '#5a7a72', padding: '32px'}}>
                Chưa có đặt phòng nào
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title"> Khách sạn của tôi</h3>
          <button style={{
            padding:'8px 16px',
            background: '#3C7363',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            + Thêm khách sạn
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên khách sạn</th>
              <th>Địa điểm</th>
              <th>Số sao</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#5a7a72', padding: '32px' }}>
                Chưa có khách sạn nào
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerDashboardPage;