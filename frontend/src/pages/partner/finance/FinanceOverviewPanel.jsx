import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../../utils/bookingDisplay';

const PIE_COLORS = ['#3C7363', '#7CB59E'];

const formatAxisMoney = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <section className={`partner-finance-chart-card ${className}`.trim()}>
    <header className="partner-finance-chart-card-header">
      <h4>{title}</h4>
      {subtitle && <p>{subtitle}</p>}
    </header>
    <div className="partner-finance-chart-card-body">{children}</div>
  </section>
);

const EmptyChart = ({ text }) => (
  <div className="partner-finance-chart-empty">{text}</div>
);

const FinanceOverviewPanel = ({ charts, recentPayments, onViewBooking }) => {
  const revenueTrend = charts?.revenue_trend || [];
  const commissionSplit = (charts?.commission_split || []).filter((item) => Number(item.value) > 0);
  const revenueByHotel = charts?.revenue_by_hotel || [];
  const hasTrend = revenueTrend.some((row) => Number(row.doanh_thu) > 0);
  const hasHotels = revenueByHotel.some((row) => Number(row.doanh_thu) > 0);

  return (
    <div className="partner-finance-overview-panel">
      <div className="partner-finance-charts-grid">
        <ChartCard
          title="Doanh thu theo tháng"
          subtitle="Biểu đồ thống kê doanh thu từ các đơn đã hoàn thành theo từng tháng."
          className="partner-finance-chart-card--wide"
        >
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ece8" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatAxisMoney} tick={{ fontSize: 12 }} width={48} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(label) => `Thời gian: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="doanh_thu"
                  name="Doanh thu"
                  stroke="#3C7363"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3C7363' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có dữ liệu doanh thu để vẽ xu hướng" />
          )}
        </ChartCard>

        <ChartCard
          title="Cơ cấu doanh thu sau hoa hồng"
          subtitle="Hoa hồng hệ thống và số tiền đối tác thực nhận"
        >
          {commissionSplit.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={commissionSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={86}
                  innerRadius={48}
                  paddingAngle={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {commissionSplit.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có dữ liệu phân bổ hoa hồng" />
          )}
        </ChartCard>

        <ChartCard
          title="Doanh thu theo khách sạn"
          subtitle="Khách sạn nào tạo nhiều doanh thu nhất?"
          className="partner-finance-chart-card--full"
        >
          {hasHotels ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, revenueByHotel.length * 48 + 40)}
            >
              <BarChart
                layout="vertical"
                data={revenueByHotel}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ece8" horizontal={false} />
                <XAxis type="number" tickFormatter={formatAxisMoney} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="ten"
                  width={168}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                <Bar dataKey="doanh_thu" name="Doanh thu" fill="#1a2e28" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có doanh thu theo khách sạn" />
          )}
        </ChartCard>
      </div>

      <section className="partner-finance-recent-card">
        <header className="partner-finance-chart-card-header">
          <h4>Đơn hoàn thành gần đây</h4>
        </header>

        {!recentPayments || recentPayments.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có đơn thanh toán gần đây</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll partner-finance-table-scroll">
            <table className="data-table data-table-grid partner-finance-recent-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th className="mgmt-col-hotel">Khách sạn</th>
                  <th className="mgmt-col-room">Loại phòng</th>
                  <th>Ngày Thanh Toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((row) => {
                  const st = TRANG_THAI[row.trang_thai] || { label: row.trang_thai, cls: 'badge-default' };
                  const pay = getPaymentDisplay(row);
                  return (
                    <tr
                      key={row.ma_dat_phong}
                      className="partner-finance-recent-row"
                      onClick={() => onViewBooking?.(row.ma_dat_phong)}
                    >
                      <td>
                        <span className="mgmt-cell-code">{row.ma_don_hang}</span>
                      </td>
                      <td className="mgmt-col-hotel">
                        <div className="partner-finance-cell-text">{row.khach_san}</div>
                      </td>
                      <td className="mgmt-col-room">
                        <div className="partner-finance-cell-text">{row.loai_phong}</div>
                      </td>
                      <td>{formatDate(row.ngay_thanh_toan)}</td>
                      <td className="partner-finance-cell-money">{formatCurrency(row.tong_tien)}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <td>
                        <span className={`badge ${pay.badge || 'badge-default'}`}>{pay.shortLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default FinanceOverviewPanel;
