import ManagementHeader from '../../components/common/management/ManagementHeader';
import MetricCard from '../../components/common/management/MetricCard';

const DashboardPage = () => {
  const stats = [
    { label: 'Người dùng', value: '0', color: '#3C7363' },
    { label: 'Khách sạn', value: '0', color: '#0958d9' },
    { label: 'Đặt phòng', value: '0', color: '#b36b00' },
    { label: 'Doanh thu', value: '0 ₫', color: '#1a7a4a' },
  ];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Tổng quan"
        subtitle="Theo dõi toàn bộ hoạt động hệ thống"
      />

      <div className="mgmt-metric-grid mgmt-metric-grid--4">
        {stats.map((s) => (
          <MetricCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Khách sạn chờ duyệt</h3>
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

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Đặt phòng gần đây</h3>
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
