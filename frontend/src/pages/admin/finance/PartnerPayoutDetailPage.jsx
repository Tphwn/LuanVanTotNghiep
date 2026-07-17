import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import {
  fetchPartnerPayoutById,
  clearPartnerPayoutDetail,
} from '../../../store/slices/adminFinanceSlice';
import { formatCurrency, formatDate } from '../../../utils/bookingDisplay';

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  thanh_toan_mot_phan: { label: 'Thanh toán một phần', cls: 'mgmt-status-text--info' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

const BOOKING_STATUS = {
  da_thu: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

const PartnerPayoutDetailPage = () => {
  const navigate = useNavigate();
  const { maDoiTac } = useParams();
  const dispatch = useDispatch();
  const { partnerPayoutDetail: detail, partnerPayoutDetailLoading: loading } = useSelector(
    (s) => s.adminFinance || {},
  );

  useEffect(() => {
    if (maDoiTac) dispatch(fetchPartnerPayoutById(maDoiTac));
    return () => { dispatch(clearPartnerPayoutDetail()); };
  }, [maDoiTac, dispatch]);

  const infoRows = useMemo(() => {
    if (!detail) return [];
    const status = PAYOUT_STATUS[detail.trang_thai] || {
      label: detail.trang_thai || '—',
      cls: '',
    };
    return [
      { label: 'Đối tác', value: detail.ten_cong_ty || `Đối tác #${detail.ma_doi_tac}` },
      { label: 'Số khách sạn', value: String(detail.so_khach_san ?? 0) },
      { label: 'Tổng số đơn', value: String(detail.tong_so_don ?? detail.bookings?.length ?? 0) },
      { label: 'Tổng doanh thu', value: formatCurrency(detail.tong_doanh_thu) },
      { label: 'Tổng hoa hồng', value: formatCurrency(detail.tong_hoa_hong) },
      {
        label: 'Đối tác thực nhận',
        value: formatCurrency(detail.tien_doi_tac_nhan),
      },
      { label: 'Đã nhận', value: formatCurrency(detail.da_nhan) },
      {
        label: 'Còn chờ nhận',
        value: formatCurrency(detail.con_cho_nhan ?? detail.so_tien_can_thanh_toan),
      },
      {
        label: 'Trạng thái tổng',
        value: status.label,
        valueClassName: `mgmt-status-text ${status.cls}`,
      },
      { label: 'Ngày thanh toán gần nhất', value: formatDate(detail.ngay_thanh_toan) },
    ];
  }, [detail]);

  const batches = detail?.batches || [];
  const bookings = detail?.bookings || [];

  return (
    <div className="mgmt-page partner-finance-page partner-finance-payout-detail-page">
      <ManagementHeader
        title="Chi tiết thanh toán đối tác"
        subtitle={detail
          ? `${detail.ten_cong_ty || `Đối tác #${detail.ma_doi_tac}`} · #${detail.ma_doi_tac}`
          : 'Thông tin thanh toán và danh sách đơn'}
        onBack={() => navigate('/admin/finance?tab=partner')}
      />

      {loading && !detail ? (
        <div className="partner-finance-loading">Đang tải chi tiết thanh toán...</div>
      ) : !detail ? (
        <div className="empty-state">
          <p className="empty-state-text">Không tìm thấy dữ liệu thanh toán đối tác</p>
        </div>
      ) : (
        <>
          <section className="partner-finance-payout-section content-card">
            <h4>Tổng quan đối tác</h4>
            <div className="partner-finance-payout-info-grid">
              {infoRows.map((row) => (
                <div className="partner-finance-payout-info-item" key={row.label}>
                  <span>{row.label}</span>
                  <strong className={row.valueClassName || undefined}>{row.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="partner-finance-payout-section content-card">
            <h4>Các đợt thanh toán</h4>
            {batches.length === 0 ? (
              <p className="partner-finance-payout-empty">Chưa có đợt thanh toán</p>
            ) : (
              <div
                className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card"
                style={{ marginTop: 0, boxShadow: 'none', border: 'none' }}
              >
                <div className="mgmt-table-scroll partner-finance-table-scroll">
                  <table className="data-table data-table-grid partner-finance-payout-orders-table">
                    <thead>
                      <tr>
                        <th>Đợt</th>
                        <th>Mã thanh toán</th>
                        <th>Số đơn</th>
                        <th>Doanh thu</th>
                        <th>Hoa hồng</th>
                        <th>Số tiền</th>
                        <th>Ngày TT</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => {
                        const st = PAYOUT_STATUS[b.trang_thai] || {
                          label: b.trang_thai,
                          cls: '',
                        };
                        const amount = b.trang_thai === 'cho_thanh_toan'
                          ? b.so_tien_can_thanh_toan
                          : b.so_tien_thanh_toan;
                        return (
                          <tr key={b.ma_dot || `${b.ma_doi_tac}-${b.ma_gd_doi_tac || b.trang_thai}`}>
                            <td>{b.ten_dot || '—'}</td>
                            <td>
                              <span className="mgmt-cell-code">{b.ma_gd_doi_tac || '—'}</span>
                            </td>
                            <td>{b.so_don ?? b.so_don_da_doi_soat}</td>
                            <td>{formatCurrency(b.tong_doanh_thu)}</td>
                            <td>{formatCurrency(b.tong_hoa_hong)}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(amount)}</td>
                            <td>{formatDate(b.ngay_thanh_toan)}</td>
                            <td>
                              <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="partner-finance-payout-section content-card">
            <h4>Danh sách đơn</h4>
            {bookings.length === 0 ? (
              <p className="partner-finance-payout-empty">Không có đơn trong kỳ này</p>
            ) : (
              <div
                className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card"
                style={{ marginTop: 0, boxShadow: 'none', border: 'none' }}
              >
                <div className="mgmt-table-scroll partner-finance-table-scroll">
                  <table className="data-table data-table-grid partner-finance-payout-orders-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Đợt</th>
                        <th>Mã TT</th>
                        <th>Khách sạn</th>
                        <th>Ngày hoàn thành</th>
                        <th>Tổng tiền</th>
                        <th>Hoa hồng</th>
                        <th>Đối tác nhận</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => {
                        const st = BOOKING_STATUS[b.trang_thai] || {
                          label: b.trang_thai || '—',
                          cls: '',
                        };
                        return (
                          <tr key={b.ma_hoa_hong || `${b.ma_don_hang}-${b.tien_hoa_hong}`}>
                            <td>
                              <span className="mgmt-cell-code">{b.ma_don_hang}</span>
                            </td>
                            <td>{b.ten_dot || '—'}</td>
                            <td>
                              <span className="mgmt-cell-code">{b.ma_gd_doi_tac || '—'}</span>
                            </td>
                            <td>
                              <div className="partner-finance-cell-ellipsis" title={b.khach_san}>
                                {b.khach_san}
                              </div>
                            </td>
                            <td>{formatDate(b.ngay_hoan_thanh)}</td>
                            <td>{formatCurrency(b.tong_tien)}</td>
                            <td>{formatCurrency(b.tien_hoa_hong)}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(b.tien_doi_tac_nhan)}</td>
                            <td>
                              <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PartnerPayoutDetailPage;
