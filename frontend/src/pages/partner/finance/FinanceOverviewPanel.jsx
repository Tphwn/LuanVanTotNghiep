import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../../utils/bookingDisplay';

const TREND_KY_OPTIONS = [
  { id: 'ngay', label: 'Theo ngày' },
  { id: 'thang', label: 'Theo tháng' },
  { id: 'quy', label: 'Theo quý' },
  { id: 'nam', label: 'Theo năm' },
];

const TREND_COLORS = {
  phi_san: '#5B8DEF',
  tien_nhan: '#3C7363',
  so_don: '#F0A202',
};

const formatAxisMoney = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

const ChartCard = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`partner-finance-chart-card ${className}`.trim()}>
    <header className="partner-finance-chart-card-header">
      <div className="partner-finance-chart-card-heading">
        <h4>{title}</h4>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="partner-finance-chart-card-actions">{actions}</div>}
    </header>
    <div className="partner-finance-chart-card-body">{children}</div>
  </section>
);

const EmptyChart = ({ text }) => (
  <div className="partner-finance-chart-empty">{text}</div>
);

const FinanceOverviewPanel = ({
  charts,
  recentPayments,
  onViewBooking,
  trendKy = 'thang',
  onTrendKyChange,
  hotelFilter = 'all',
}) => {
  const revenueTrend = charts?.revenue_trend || [];
  const reconciliation = charts?.reconciliation_status || { tong_don: 0, items: [] };
  const reconciliationItems = (reconciliation.items || []).filter((item) => Number(item.value) >= 0);
  const hasTrend = revenueTrend.some(
    (row) => Number(row.phi_san) > 0
      || Number(row.tien_nhan) > 0
      || Number(row.doanh_thu) > 0
      || Number(row.so_don) > 0,
  );
  const tongDonDoiSoat = Number(reconciliation.tong_don) || reconciliationItems.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0,
  );
  const hasReconciliation = tongDonDoiSoat > 0;

  const trendTitle = {
    ngay: 'Phân rã doanh thu theo ngày',
    thang: 'Phân rã doanh thu theo tháng',
    quy: 'Phân rã doanh thu theo quý',
    nam: 'Phân rã doanh thu theo năm',
  }[trendKy] || 'Phân rã doanh thu theo tháng';

  const trendSubtitle = hotelFilter === 'all'
    ? 'Đang cộng gộp tất cả khách sạn. Chọn 1 KS ở bộ lọc phía trên để xem riêng.'
    : 'Đang xem theo khách sạn đã chọn ở bộ lọc phía trên.';

  return (
    <div className="partner-finance-overview-panel">
      <div className="partner-finance-charts-grid">
        <ChartCard
          title={trendTitle}
          subtitle={trendSubtitle}
          actions={(
            <div className="partner-finance-ky-toggle" role="group" aria-label="Nhóm theo kỳ">
              {TREND_KY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`partner-finance-ky-btn${trendKy === opt.id ? ' is-active' : ''}`}
                  onClick={() => onTrendKyChange?.(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        >
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ece8" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="money"
                  tickFormatter={formatAxisMoney}
                  tick={{ fontSize: 11 }}
                  width={44}
                  label={{
                    value: 'Tiền (đ)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    style: { fontSize: 11, fill: '#5a7a72' },
                  }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  width={36}
                  label={{
                    value: 'Số đơn',
                    angle: 90,
                    position: 'insideRight',
                    offset: 4,
                    style: { fontSize: 11, fill: '#5a7a72' },
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Số đơn đặt') return [value, name];
                    return [formatCurrency(value), name];
                  }}
                  labelFormatter={(label) => `Thời gian: ${label}`}
                />
                <Legend />
                <Bar
                  yAxisId="money"
                  dataKey="phi_san"
                  name="Phí sàn"
                  stackId="rev"
                  fill={TREND_COLORS.phi_san}
                  maxBarSize={36}
                />
                <Bar
                  yAxisId="money"
                  dataKey="tien_nhan"
                  name="Tiền nhận"
                  stackId="rev"
                  fill={TREND_COLORS.tien_nhan}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="so_don"
                  name="Số đơn đặt"
                  stroke={TREND_COLORS.so_don}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: TREND_COLORS.so_don }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có dữ liệu doanh thu để vẽ xu hướng" />
          )}
        </ChartCard>

        <ChartCard
          title="Trạng thái đối soát"
          subtitle="Tỷ lệ đơn theo trạng thái trong khoảng đã chọn."
        >
          {hasReconciliation ? (
            <div className="partner-finance-reconciliation">
              <div className="partner-finance-reconciliation-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={reconciliationItems}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={82}
                      innerRadius={52}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {reconciliationItems.map((entry) => (
                        <Cell key={entry.key || entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const pct = tongDonDoiSoat > 0
                          ? Math.round((Number(value) / tongDonDoiSoat) * 100)
                          : 0;
                        return [`${value} đơn (${pct}%)`, name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="partner-finance-reconciliation-center">
                  <strong>{tongDonDoiSoat}</strong>
                  <span>đơn</span>
                </div>
              </div>
              <ul className="partner-finance-reconciliation-legend">
                {reconciliationItems.map((item) => {
                  const value = Number(item.value) || 0;
                  const pct = tongDonDoiSoat > 0
                    ? Math.round((value / tongDonDoiSoat) * 100)
                    : 0;
                  return (
                    <li key={item.key || item.name}>
                      <span
                        className="partner-finance-reconciliation-dot"
                        style={{ background: item.color }}
                      />
                      <span className="partner-finance-reconciliation-name">{item.name}</span>
                      <strong>
                        {value}
                        {' '}
                        đơn (
                        {pct}
                        %)
                      </strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <EmptyChart text="Chưa có đơn đối soát trong khoảng đã chọn" />
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
