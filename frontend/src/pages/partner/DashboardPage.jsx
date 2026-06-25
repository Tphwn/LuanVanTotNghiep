import { useNavigate } from 'react-router-dom';
import ManagementHeader from '../../components/common/management/ManagementHeader';
import MetricCard from '../../components/common/management/MetricCard';

const PartnerDashboardPage = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Khách sạn', value: '0', color: '#3C7363' },
    { label: 'Loại phòng', value: '0', color: '#0958d9' },
    { label: 'Đặt phòng', value: '0', color: '#b36b00' },
    { label: 'Doanh thu', value: '0 ₫', color: '#1a7a4a' },
  ];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Tổng quan"
        subtitle="Quản lý khách sạn và đơn đặt phòng của bạn"
        actionLabel="+ Thêm khách sạn"
        onAction={() => navigate('/partner/hotels/create')}
      />

      <div className="mgmt-metric-grid mgmt-metric-grid--4">
        {stats.map((s) => (
          <MetricCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid" style={{ marginBottom: 16 }}>
        <div className="mgmt-table-card-header">
          <span className="mgmt-table-card-title">Đặt phòng mới nhất</span>
          <span className="badge badge-info">0 đơn mới</span>
        </div>
        <div className="mgmt-table-scroll">
          <table className="data-table data-table-grid">
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
                <td colSpan={7} style={{ textAlign: 'center', color: '#5a7a72', padding: '32px' }}>
                  Chưa có đặt phòng nào
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        <div className="mgmt-table-card-header">
          <span className="mgmt-table-card-title">Khách sạn của tôi</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/partner/hotels/create')}
          >
            + Thêm khách sạn
          </button>
        </div>
        <div className="mgmt-table-scroll">
          <table className="data-table data-table-grid">
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
    </div>
  );
};

export default PartnerDashboardPage;
