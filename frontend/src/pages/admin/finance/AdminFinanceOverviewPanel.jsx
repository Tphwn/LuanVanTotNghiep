const TX_STATUS_CLS = {
  cho: 'mgmt-status-text--pending',
  thanh_cong: 'mgmt-status-text--active',
  that_bai: 'mgmt-status-text--danger',
  da_hoan_tien: 'mgmt-status-text--info',
  hoan_thanh: 'mgmt-status-text--active',
};

const TX_STATUS_LABEL = {
  cho: 'Chờ',
  thanh_cong: 'Thành công',
  that_bai: 'Thất bại',
  da_hoan_tien: 'Đã hoàn tiền',
  hoan_thanh: 'Hoàn thành',
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

const fmtDateLabel = (isoDate) => {
  if (!isoDate) return 'Hôm nay';
  const [y, m, d] = String(isoDate).split('-');
  if (!y || !m || !d) return 'Hôm nay';
  return `${d}/${m}/${y}`;
};

const StatCard = ({ title, value, subtitle, tone }) => (
  <div className={`admin-finance-metric${tone ? ` admin-finance-metric--${tone}` : ''}`}>
    <span className="admin-finance-metric-label">{title}</span>
    <strong className="admin-finance-metric-value">{value}</strong>
    <span className={`admin-finance-metric-sub${subtitle ? '' : ' is-empty'}`}>
      {subtitle || '\u00A0'}
    </span>
  </div>
);

const TaskCard = ({
  label,
  count,
  unit,
  amount,
  hint,
  tone = 'neutral',
  onClick,
}) => (
  <button
    type="button"
    className={`admin-finance-today-card admin-finance-today-card--${tone}${count > 0 ? ' has-items' : ''}`}
    onClick={onClick}
  >
    <span className="admin-finance-today-card-label">{label}</span>
    <strong className="admin-finance-today-card-count">
      {count} {unit}
    </strong>
    {amount != null && amount > 0 && (
      <span className="admin-finance-today-card-amount">{fmt(amount)}</span>
    )}
    {hint && <span className="admin-finance-today-card-hint">{hint}</span>}
  </button>
);

const AdminFinanceOverviewPanel = ({
  overview,
  onGoRefunds,
  onGoCommissions,
  onGoPartner,
  onGoTransactions,
  onViewTransaction,
}) => {
  const cards = overview?.cards || {};
  const today = overview?.viec_hom_nay || {};
  const partnerWait = today.doi_tac_cho_thanh_toan || {};
  const refundWait = today.don_cho_hoan_tien || {};
  const commissionWait = today.hoa_hong_cho_doi_soat || {};
  const txSuccess = today.giao_dich_thanh_cong || {};
  const txFailed = today.giao_dich_that_bai || {};

  const todayTxRows = [
    ...(txFailed.danh_sach || []).map((tx) => ({ ...tx, _group: 'fail' })),
    ...(txSuccess.danh_sach || []).map((tx) => ({ ...tx, _group: 'ok' })),
  ].sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian));

  const pendingTotal =
    (Number(partnerWait.so_luong) || 0)
    + (Number(refundWait.so_luong) || 0)
    + (Number(commissionWait.so_luong) || 0)
    + (Number(txFailed.so_luong) || 0);

  return (
    <div className="admin-finance-overview-panel">
      <div className="admin-finance-metrics admin-finance-metrics--6">
        <StatCard
          title="Tổng doanh thu"
          value={fmt(cards.tong_doanh_thu)}
          subtitle="Tổng thanh toán"
          tone="neutral"
        />
        <StatCard
          title="Hoa hồng "
          value={fmt(cards.hoa_hong_he_thong)}
          subtitle="Hoa hồng ban đầu"
          tone="info"
        />
        <StatCard
          title="Chi phí trợ giá"
          value={fmt(cards.chi_phi_tro_gia)}
          subtitle="Voucher do sàn tài trợ"
          tone="warning"
        />
        <StatCard
          title="Hoa hồng thực nhận"
          value={fmt(cards.doanh_thu_rong_san ?? cards.doanh_thu_thuc_nhan)}
          subtitle="Hoa hồng − trợ giá"
          tone="success"
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

      <section className="admin-finance-today-section">
        <header className="admin-finance-today-header">
          <div>
            <h4>Công việc hôm nay</h4>
            <p>
              Việc cần theo dõi và xử lý trong ngày {fmtDateLabel(today.ngay)}
            </p>
          </div>
        </header>

        <div className="admin-finance-today-grid">
          <TaskCard
            label="Đối tác chờ thanh toán"
            count={Number(partnerWait.so_luong) || 0}
            unit="đối tác"
            amount={Number(partnerWait.so_tien) || 0}
            hint="Đã đối soát, chờ chi trả"
            tone="warning"
            onClick={onGoPartner}
          />
          <TaskCard
            label="Đơn cần hoàn tiền"
            count={Number(refundWait.so_luong) || 0}
            unit="đơn"
            hint="Chờ xác nhận đã chuyển"
            tone="warning"
            onClick={onGoRefunds}
          />
          <TaskCard
            label="Hoa hồng chờ đối soát"
            count={Number(commissionWait.so_luong) || 0}
            unit="đơn"
            hint="Cần xác nhận đối soát"
            tone="info"
            onClick={onGoCommissions}
          />
          <TaskCard
            label="Giao dịch thành công hôm nay"
            count={Number(txSuccess.so_luong) || 0}
            unit="giao dịch"
            hint="Thanh toán thành công trong ngày"
            tone="success"
            onClick={onGoTransactions}
          />
          <TaskCard
            label="Giao dịch lỗi hôm nay"
            count={Number(txFailed.so_luong) || 0}
            unit="giao dịch"
            hint="Cần kiểm tra nếu có"
            tone="danger"
            onClick={onGoTransactions}
          />
        </div>

        {(partnerWait.danh_sach?.length > 0 || refundWait.danh_sach?.length > 0) && (
          <div className="admin-finance-today-lists">
            {partnerWait.danh_sach?.length > 0 && (
              <div className="admin-finance-today-list-card">
                <header className="admin-finance-chart-card-header">
                  <h4>Đối tác chờ chi trả</h4>
                  <p>Ưu tiên xử lý các khoản đã đối soát</p>
                </header>
                <ul className="admin-finance-today-list">
                  {partnerWait.danh_sach.map((p) => (
                    <li key={p.ma_doi_tac}>
                      <button type="button" onClick={onGoPartner}>
                        <span className="admin-finance-today-list-title">{p.ten}</span>
                        <span className="admin-finance-today-list-meta">
                          {p.so_don} đơn · {fmt(p.so_tien)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {refundWait.danh_sach?.length > 0 && (
              <div className="admin-finance-today-list-card">
                <header className="admin-finance-chart-card-header">
                  <h4>Đơn chờ hoàn tiền</h4>
                  <p>Xác nhận sau khi đã chuyển tiền cho khách</p>
                </header>
                <ul className="admin-finance-today-list">
                  {refundWait.danh_sach.map((r) => (
                    <li key={r.ma_hoan_tien}>
                      <button type="button" onClick={onGoRefunds}>
                        <span className="admin-finance-today-list-title">
                          {r.ma_don_hang} · {r.khach_hang}
                        </span>
                        <span className="admin-finance-today-list-meta">
                          {r.khach_san} · {fmt(r.so_tien_hoan)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="admin-finance-today-tx-card">
          <header className="admin-finance-chart-card-header">
            <h4>Giao dịch trong ngày</h4>
            <p>
              Thành công: {Number(txSuccess.so_luong) || 0}
              {' · '}
              Lỗi: {Number(txFailed.so_luong) || 0}
            </p>
          </header>
          {todayTxRows.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Hôm nay chưa có giao dịch thanh toán</p>
            </div>
          ) : (
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-finance-recent-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Mã đơn</th>
                    <th className="mgmt-col-hotel">Khách sạn</th>
                    <th className="mgmt-col-customer">Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTxRows.map((tx) => (
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
                      <td className="mgmt-col-hotel">{tx.khach_san}</td>
                      <td className="mgmt-col-customer">{tx.khach_hang}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(tx.so_tien)}</td>
                      <td>
                        <span className={`mgmt-status-text ${TX_STATUS_CLS[tx.trang_thai] || ''}`}>
                          {tx.trang_thai_label || TX_STATUS_LABEL[tx.trang_thai] || tx.trang_thai}
                        </span>
                      </td>
                      <td>{fmtDateTime(tx.thoi_gian)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminFinanceOverviewPanel;
