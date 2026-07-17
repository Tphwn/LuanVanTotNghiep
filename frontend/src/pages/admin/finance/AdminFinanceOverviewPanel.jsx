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

const PIE_COLORS = ['#3C7363', '#1a2e28', '#7CB59E'];

const TX_STATUS_CLS = {
  cho: 'mgmt-status-text--pending',
  thanh_cong: 'mgmt-status-text--active',
  that_bai: 'mgmt-status-text--danger',
};

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
};

const formatAxisMoney = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <section className={`admin-finance-chart-card ${className}`.trim()}>
    <header className="admin-finance-chart-card-header">
      <h4>{title}</h4>
      {subtitle && <p>{subtitle}</p>}
    </header>
    <div className="admin-finance-chart-card-body">{children}</div>
  </section>
);

const EmptyChart = ({ text }) => (
  <div className="admin-finance-chart-empty">{text}</div>
);

const StatCard = ({ title, value, subtitle, tone }) => (
  <div className={`admin-finance-metric${tone ? ` admin-finance-metric--${tone}` : ''}`}>
    <span className="admin-finance-metric-label">{title}</span>
    <strong className="admin-finance-metric-value">{value}</strong>
    <span className={`admin-finance-metric-sub${subtitle ? '' : ' is-empty'}`}>
      {subtitle || '\u00A0'}
    </span>
  </div>
);

const AdminFinanceOverviewPanel = ({
  overview,
  onGoRefunds,
  onGoCommissions,
  onGoPartner,
  onViewTransaction,
}) => {
  const cards = overview?.cards || {};
  const charts = overview?.charts || {};
  const canXuLy = overview?.can_xu_ly || {};
  const recentTransactions = overview?.recent_transactions || [];

  const revenueTrend = charts.revenue_trend || [];
  const financeSplit = (charts.finance_split || []).filter((item) => Number(item.value) > 0);
  const revenueByPartner = charts.revenue_by_partner || [];
  const hasTrend = revenueTrend.some((row) => Number(row.doanh_thu) > 0);
  const hasPartners = revenueByPartner.some((row) => Number(row.doanh_thu) > 0);

  const actionItems = [
    {
      key: 'refund',
      label: 'Đơn chờ hoàn tiền',
      count: Number(canXuLy.don_cho_hoan_tien) || 0,
      unit: 'đơn',
      onClick: onGoRefunds,
    },
    {
      key: 'commission',
      label: 'Hoa hồng chờ đối soát',
      count: Number(canXuLy.hoa_hong_cho_doi_soat) || 0,
      unit: 'đơn',
      onClick: onGoCommissions,
    },
    {
      key: 'partner',
      label: 'Đối tác chờ thanh toán',
      count: Number(canXuLy.doi_tac_cho_thanh_toan) || 0,
      unit: 'đối tác',
      amount: Number(canXuLy.so_tien_cho_thanh_toan) || 0,
      onClick: onGoPartner,
    },
  ];

  return (
    <div className="admin-finance-overview-panel">
      <div className="admin-finance-metrics admin-finance-metrics--6">
        <StatCard
          title="Tổng doanh thu"
          value={fmt(cards.tong_doanh_thu)}
          subtitle="Đơn hoàn thành hợp lệ"
          tone="neutral"
        />
        <StatCard
          title="Giao dịch thành công"
          value={`${cards.giao_dich_thanh_cong ?? 0}`}
          subtitle="Giao dịch thanh toán"
          tone="success"
        />
        <StatCard
          title="Chờ hoàn tiền"
          value={`${cards.cho_hoan_tien ?? 0}`}
          subtitle="Đơn cần xử lý"
          tone="warning"
        />
        <StatCard
          title="Hoa hồng hệ thống"
          value={fmt(cards.hoa_hong_he_thong)}
          subtitle="Tiền hệ thống giữ lại"
          tone="info"
        />
        <StatCard
          title="Chờ thanh toán đối tác"
          value={fmt(cards.cho_thanh_toan_doi_tac)}
          subtitle="Đã đối soát chưa TT"
          tone="warning"
        />
        <StatCard
          title="Đã thanh toán đối tác"
          value={fmt(cards.da_thanh_toan_doi_tac)}
          subtitle="Đã chuyển cho đối tác"
          tone="success"
        />
      </div>

      <div className="admin-finance-charts-grid">
        <ChartCard
          title="Doanh thu theo tháng"
          subtitle="Biểu đồ thống kê doanh thu từ các đơn đã hoàn thành theo từng tháng."
          className="admin-finance-chart-card--wide"
        >
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ece8" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatAxisMoney} tick={{ fontSize: 12 }} width={48} />
                <Tooltip
                  formatter={(value) => [fmt(value), 'Doanh thu']}
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
            <EmptyChart text="Chưa có dữ liệu doanh thu theo tháng" />
          )}
        </ChartCard>

        <ChartCard
          title="Cơ cấu tài chính"
          subtitle="Hoa hồng hệ thống, đã thanh toán và chờ thanh toán đối tác"
        >
          {financeSplit.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={financeSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={86}
                  innerRadius={48}
                  paddingAngle={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {financeSplit.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có dữ liệu cơ cấu tài chính" />
          )}
        </ChartCard>

        <ChartCard
          title="Doanh thu theo đối tác"
          subtitle="Đối tác nào tạo nhiều doanh thu nhất?"
          className="admin-finance-chart-card--full"
        >
          {hasPartners ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, revenueByPartner.length * 48 + 40)}
            >
              <BarChart
                layout="vertical"
                data={revenueByPartner}
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
                <Tooltip formatter={(value) => [fmt(value), 'Doanh thu']} />
                <Bar
                  dataKey="doanh_thu"
                  name="Doanh thu"
                  fill="#1a2e28"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Chưa có doanh thu theo đối tác" />
          )}
        </ChartCard>
      </div>

      <section className="admin-finance-action-card">
        <header className="admin-finance-chart-card-header">
          <h4>Cần xử lý</h4>
          <p>Các khoản đang chờ admin xử lý</p>
        </header>
        <div className="admin-finance-action-grid">
          {actionItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-finance-action-item${item.count > 0 ? ' has-pending' : ''}`}
              onClick={item.onClick}
            >
              <span className="admin-finance-action-label">{item.label}</span>
              <strong className="admin-finance-action-count">
                {item.count} {item.unit}
              </strong>
              {item.key === 'partner' && item.amount > 0 && (
                <span className="admin-finance-action-amount">{fmt(item.amount)}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-finance-recent-card">
        <header className="admin-finance-chart-card-header">
          <h4>Giao dịch gần đây</h4>
          <p>8 giao dịch thanh toán mới nhất</p>
        </header>
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có giao dịch gần đây</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid admin-finance-recent-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Mã đơn</th>
                  <th>Khách sạn</th>
                  <th>Khách hàng</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.ma_thanh_toan}
                    className="admin-finance-recent-row"
                    onClick={() => onViewTransaction?.(tx.ma_thanh_toan)}
                  >
                    <td>
                      <span className="mgmt-cell-code">{tx.ma_giao_dich}</span>
                    </td>
                    <td>
                      <span className="mgmt-cell-code">{tx.ma_don_hang}</span>
                    </td>
                    <td>{tx.khach_san}</td>
                    <td>{tx.khach_hang}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(tx.so_tien)}</td>
                    <td>
                      <span className={`mgmt-status-text ${TX_STATUS_CLS[tx.trang_thai] || ''}`}>
                        {tx.trang_thai_label}
                      </span>
                    </td>
                    <td>{fmtDateTime(tx.thoi_gian)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminFinanceOverviewPanel;
