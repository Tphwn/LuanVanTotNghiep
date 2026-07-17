import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import { formatCurrency, formatDate } from '../../../utils/bookingDisplay';

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

const BOOKING_STATUS = {
  da_thu: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

const PayoutDetailPage = () => {
  const navigate = useNavigate();
  const { maDot: maDotParam } = useParams();
  const maDot = maDotParam ? decodeURIComponent(maDotParam) : null;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!maDot) {
        setDetail(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/partner/finance/payout-detail', {
          params: { ma_dot: maDot },
        });
        if (!cancelled) setDetail(res.data.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không tải được chi tiết thanh toán');
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(load, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [maDot]);

  const infoRows = useMemo(() => {
    if (!detail) return [];
    const status = PAYOUT_STATUS[detail.trang_thai] || {
      label: detail.trang_thai || '—',
      cls: '',
    };
    return [
      { label: 'Đợt', value: detail.ten_dot || '—' },
      { label: 'Mã thanh toán', value: detail.ma_gd_doi_tac || '—' },
      { label: 'Tổng số đơn', value: String(detail.tong_so_don ?? detail.bookings?.length ?? 0) },
      { label: 'Tổng doanh thu', value: formatCurrency(detail.tong_doanh_thu) },
      { label: 'Tổng hoa hồng', value: formatCurrency(detail.tong_hoa_hong) },
      { label: 'Đối tác thực nhận', value: formatCurrency(detail.tien_doi_tac_nhan ?? detail.so_tien_nhan) },
      { label: 'Đã nhận', value: formatCurrency(detail.da_nhan) },
      { label: 'Còn chờ nhận', value: formatCurrency(detail.con_cho_nhan) },
      {
        label: 'Trạng thái thanh toán',
        value: status.label,
        valueClassName: `mgmt-status-text ${status.cls}`,
      },
      { label: 'Ngày thanh toán', value: formatDate(detail.ngay_thanh_toan) },
      {
        label: 'Phương thức',
        value: detail.phuong_thuc_tt || '—',
      },
    ];
  }, [detail]);

  return (
    <div className="mgmt-page partner-finance-page partner-finance-payout-detail-page">
      <ManagementHeader
        title="Chi tiết đợt thanh toán"
        subtitle={detail
          ? `${detail.ten_dot || 'Đợt thanh toán'}${detail.ma_gd_doi_tac ? ` · ${detail.ma_gd_doi_tac}` : ''}`
          : 'Thông tin đợt thanh toán và danh sách đơn'}
        onBack={() => navigate('/partner/finance?tab=payout')}
      />

      {error && <div className="mgmt-toast error">{error}</div>}

      {loading ? (
        <div className="partner-finance-loading">Đang tải chi tiết thanh toán...</div>
      ) : !detail ? (
        <div className="empty-state">
          <p className="empty-state-text">Không tìm thấy đợt thanh toán</p>
        </div>
      ) : (
        <>
          <section className="partner-finance-payout-section content-card">
            <h4>Thông tin đợt thanh toán</h4>
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
            <h4>Danh sách đơn trong đợt</h4>
            {(!detail.bookings || detail.bookings.length === 0) ? (
              <p className="partner-finance-payout-empty">Không có đơn trong đợt này</p>
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
                        <th>Khách sạn</th>
                        <th>Loại phòng</th>
                        <th>Ngày hoàn thành</th>
                        <th>Tổng tiền</th>
                        <th>Hoa hồng</th>
                        <th>Đối tác nhận</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.bookings.map((b) => {
                        const st = BOOKING_STATUS[b.trang_thai] || {
                          label: b.trang_thai || '—',
                          cls: '',
                        };
                        return (
                          <tr key={`${b.ma_don_hang}-${b.tien_hoa_hong}`}>
                            <td>
                              <span className="mgmt-cell-code">{b.ma_don_hang}</span>
                            </td>
                            <td>
                              <div className="partner-finance-cell-ellipsis" title={b.khach_san}>
                                {b.khach_san}
                              </div>
                            </td>
                            <td>
                              <div className="partner-finance-cell-ellipsis" title={b.loai_phong}>
                                {b.loai_phong || '—'}
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

export default PayoutDetailPage;
