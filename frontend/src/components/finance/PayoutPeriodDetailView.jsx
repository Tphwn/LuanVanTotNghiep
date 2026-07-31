import { formatCurrency, formatDate } from '../../utils/bookingDisplay';

const STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
};

const dash = (v) => (v == null || v === '' ? '—' : v);

/**
 * Shared 4-block payout period detail (admin + partner).
 */
const PayoutPeriodDetailView = ({ detail }) => {
  if (!detail) return null;

  const status = STATUS[detail.trang_thai] || {
    label: detail.trang_thai || '—',
    cls: '',
  };
  const isPaid = detail.trang_thai === 'da_thanh_toan';
  const bank = detail.tai_khoan_ngan_hang || {};
  const hotels = detail.danh_sach_khach_san || [];
  const bookings = detail.bookings || [];
  const proof = detail.minh_chung || {};

  const tongDoanhThu = detail.tong_doanh_thu ?? 0;
  const tongHoaHong = detail.tong_hoa_hong ?? 0;
  const tongThucTra = isPaid
    ? (detail.so_tien_thanh_toan ?? detail.tien_doi_tac_nhan ?? detail.so_tien_nhan ?? 0)
    : (detail.so_tien_can_thanh_toan ?? detail.con_cho_nhan ?? detail.tien_doi_tac_nhan ?? 0);

  const maPhieu = isPaid
    ? (detail.ma_phieu_thanh_toan || detail.ma_gd_doi_tac || null)
    : null;

  return (
    <div className="payout-period-detail">
      <div className="payout-period-status-bar">
        <span className={`mgmt-status-text ${status.cls}`}>{status.label}</span>
        {detail.ten_dot ? (
          <span className="payout-period-status-dot">{detail.ten_dot}</span>
        ) : null}
      </div>

      {/* Khối 1 */}
      <section className="content-card payout-period-block">
        <h3 className="payout-period-block-title">Thông tin tổng quan kỳ thanh toán</h3>
        <div className="payout-period-grid">
          <div className="payout-period-field">
            <span className="payout-period-label">Mã phiếu thanh toán</span>
            <strong className="payout-period-value">
              {maPhieu ? <span className="mgmt-cell-code">{maPhieu}</span> : 'Chưa phát hành'}
            </strong>
          </div>
          <div className="payout-period-field">
            <span className="payout-period-label">Đối tác / Công ty</span>
            <strong className="payout-period-value">{dash(detail.ten_cong_ty)}</strong>
          </div>
          <div className="payout-period-field payout-period-field--full">
            <span className="payout-period-label">Cơ sở lưu trú</span>
            <strong className="payout-period-value">
              {hotels.length ? hotels.join(', ') : '—'}
            </strong>
          </div>
          <div className="payout-period-field payout-period-field--full">
            <span className="payout-period-label">Tài khoản nhận tiền</span>
            {bank.da_cap_nhat ? (
              <div className="payout-period-bank">
                {bank.logo_ngan_hang ? (
                  <img src={bank.logo_ngan_hang} alt="" className="partner-bank-logo" />
                ) : null}
                <div>
                  <div>{bank.ten_ngan_hang || '—'}</div>
                  <div className="payout-period-bank-meta">
                    STK: {bank.so_tai_khoan || '—'}
                    {' · '}
                    {bank.ten_chu_tai_khoan || '—'}
                  </div>
                </div>
              </div>
            ) : (
              <strong className="payout-period-value payout-period-value--warn">
                Chưa cập nhật tài khoản nhận tiền
              </strong>
            )}
          </div>
          <div className="payout-period-field">
            <span className="payout-period-label">Ngày đối soát</span>
            <strong className="payout-period-value">{formatDate(detail.ngay_doi_soat)}</strong>
          </div>
          <div className="payout-period-field">
            <span className="payout-period-label">Ngày thanh toán</span>
            <strong className="payout-period-value">
              {isPaid ? formatDate(detail.ngay_thanh_toan) : 'Chưa thanh toán'}
            </strong>
          </div>
        </div>
      </section>

      {/* Khối 2 */}
      <section className="content-card payout-period-block">
        <h3 className="payout-period-block-title">Tóm tắt số liệu tài chính</h3>
        <div className="payout-overview-finance">
          <div className="payout-finance-card payout-finance-card--neutral">
            <span className="payout-finance-label">Tổng doanh thu đơn đặt (Gốc)</span>
            <strong className="payout-finance-value">{formatCurrency(tongDoanhThu)}</strong>
          </div>
          <div className="payout-finance-card payout-finance-card--deduct">
            <span className="payout-finance-label">Hoa hồng sàn được hưởng</span>
            <strong className="payout-finance-value">{formatCurrency(tongHoaHong)}</strong>
          </div>
          <div className="payout-finance-card payout-finance-card--receive">
            <span className="payout-finance-label">Tổng tiền thực trả cho đối tác</span>
            <strong className="payout-finance-value payout-finance-value--xl">
              {formatCurrency(tongThucTra)}
            </strong>
          </div>
        </div>
      </section>

      {/* Khối 3 */}
      <section className="content-card payout-period-block">
        <h3 className="payout-period-block-title">
          Bảng kê chi tiết đơn hàng ({bookings.length})
        </h3>
        {!bookings.length ? (
          <p className="partner-finance-payout-empty">Không có đơn trong kỳ này</p>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid admin-mgmt-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày check-in/out</th>
                  <th>Tổng tiền đơn</th>
                  <th>% Hoa hồng</th>
                  <th>Hoa hồng sàn</th>
                  <th>Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.ma_hoa_hong || b.ma_dat_phong || b.ma_don_hang}>
                    <td><span className="mgmt-cell-code">{b.ma_don_hang}</span></td>
                    <td>{b.khach_hang || '—'}</td>
                    <td>
                      {formatDate(b.ngay_nhan_phong)}
                      {' → '}
                      {formatDate(b.ngay_tra_phong || b.ngay_hoan_thanh)}
                    </td>
                    <td>{formatCurrency(b.tong_tien)}</td>
                    <td>{b.ty_le_hoa_hong != null ? `${b.ty_le_hoa_hong}%` : '—'}</td>
                    <td style={{ color: '#b36b00', fontWeight: 500 }}>
                      {formatCurrency(b.tien_hoa_hong)}
                    </td>
                    <td style={{ color: '#3C7363', fontWeight: 700 }}>
                      {formatCurrency(b.tien_doi_tac_nhan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Khối 4 */}
      <section className="content-card payout-period-block">
        <h3 className="payout-period-block-title">Minh chứng giao dịch</h3>
        <div className="payout-period-grid">
          <div className="payout-period-field">
            <span className="payout-period-label">Phương thức thanh toán</span>
            <strong className="payout-period-value">
              {isPaid ? dash(proof.phuong_thuc) : 'Chưa thanh toán'}
            </strong>
          </div>
          <div className="payout-period-field">
            <span className="payout-period-label">Mã giao dịch</span>
            <strong className="payout-period-value">
              {isPaid ? dash(proof.ma_giao_dich) : '—'}
            </strong>
          </div>
          <div className="payout-period-field payout-period-field--full">
            <span className="payout-period-label">Ghi chú của Admin</span>
            <strong className="payout-period-value">
              {isPaid ? dash(proof.ghi_chu) : '—'}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PayoutPeriodDetailView;
