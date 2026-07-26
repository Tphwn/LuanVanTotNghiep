import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import { formatCurrency, formatDate } from '../../../utils/bookingDisplay';

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  thanh_toan_mot_phan: { label: 'Thanh toán một phần', cls: 'badge-info' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
};

const BOOKING_STATUS = {
  da_thu: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
};

const PayoutDetailPage = () => {
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

  const status = useMemo(() => {
    if (!detail) return { label: '—', cls: '' };
    return PAYOUT_STATUS[detail.trang_thai] || {
      label: detail.trang_thai || '—',
      cls: '',
    };
  }, [detail]);

  const receiveAmount = detail
    ? (detail.trang_thai === 'cho_thanh_toan'
      ? (detail.con_cho_nhan ?? detail.tien_doi_tac_nhan ?? detail.so_tien_nhan)
      : (detail.tien_doi_tac_nhan ?? detail.so_tien_nhan ?? detail.da_nhan))
    : 0;

  const bookings = detail?.bookings || [];

  return (
    <div className="mgmt-page partner-finance-page partner-finance-payout-detail-page">
      <ManagementHeader
        title="Chi tiết thanh toán"
        backTo="/partner/finance?tab=payout"
        backLabel="Quay lại"
      />

      {error && <div className="mgmt-toast error">{error}</div>}

      {loading && !detail ? (
        <div className="partner-finance-loading">Đang tải chi tiết thanh toán...</div>
      ) : !detail ? (
        <div className="empty-state">
          <p className="empty-state-text">Không tìm thấy dữ liệu thanh toán</p>
        </div>
      ) : (
        <>
          <section className="partner-finance-payout-section content-card payout-overview">
            <div className="payout-overview-identity">
              <div className="payout-overview-identity-main">
                <span className="payout-overview-kicker">Đợt thanh toán</span>
                <h2 className="payout-overview-name">
                  {detail.ten_dot || 'Đợt thanh toán'}
                </h2>
                <p className="payout-overview-meta">
                  Mã TT: {detail.ma_gd_doi_tac || '—'}
                  {' · '}
                  {detail.tong_so_don ?? bookings.length} đơn
                  {detail.phuong_thuc_tt ? ` · ${detail.phuong_thuc_tt}` : ''}
                </p>
              </div>
              <span className={`badge ${status.cls}`}>{status.label}</span>
            </div>

            <div className="payout-overview-finance">
              <div className="payout-finance-card payout-finance-card--neutral">
                <span className="payout-finance-label">Tổng doanh thu</span>
                <strong className="payout-finance-value">
                  {formatCurrency(detail.tong_doanh_thu)}
                </strong>
              </div>
              <div className="payout-finance-card payout-finance-card--deduct">
                <span className="payout-finance-label">Tổng hoa hồng bị trừ</span>
                <strong className="payout-finance-value">
                  {formatCurrency(detail.tong_hoa_hong)}
                </strong>
              </div>
              <div className="payout-finance-card payout-finance-card--receive">
                <span className="payout-finance-label">Đối tác thực nhận</span>
                <strong className="payout-finance-value">
                  {formatCurrency(receiveAmount)}
                </strong>
              </div>
            </div>

            <div className="payout-overview-debt">
              <div className="payout-debt-item">
                <span className="payout-debt-label">Đã nhận</span>
                <strong className="payout-debt-value payout-debt-value--ok">
                  {formatCurrency(detail.da_nhan)}
                </strong>
              </div>
              <div className="payout-debt-item">
                <span className="payout-debt-label">Còn chờ nhận</span>
                <strong className="payout-debt-value payout-debt-value--wait">
                  {formatCurrency(detail.con_cho_nhan)}
                </strong>
              </div>
              <div className="payout-debt-item">
                <span className="payout-debt-label">Ngày thanh toán</span>
                <strong className="payout-debt-value">
                  {formatDate(detail.ngay_thanh_toan)}
                </strong>
              </div>
            </div>
          </section>

          <section className="partner-finance-payout-section content-card">
            <h4>Danh sách đơn trong đợt</h4>
            {bookings.length === 0 ? (
              <p className="partner-finance-payout-empty">Không có đơn trong đợt này</p>
            ) : (
              <div className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card payout-table-wrap">
                <div className="mgmt-table-scroll partner-finance-table-scroll">
                  <table className="data-table payout-finance-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách sạn</th>
                        <th>Loại phòng</th>
                        <th>Ngày HT</th>
                        <th className="is-money">Tổng tiền</th>
                        <th className="is-money">Hoa hồng</th>
                        <th className="is-money">Đối tác nhận</th>
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
                          <tr key={`${b.ma_don_hang}-${b.tien_hoa_hong}`}>
                            <td>
                              <span className="mgmt-cell-code">{b.ma_don_hang}</span>
                            </td>
                            <td>
                              <span className="payout-batch-hotel" title={b.khach_san}>
                                {b.khach_san}
                              </span>
                            </td>
                            <td>
                              <div className="partner-finance-cell-ellipsis" title={b.loai_phong}>
                                {b.loai_phong || '—'}
                              </div>
                            </td>
                            <td className="is-date">{formatDate(b.ngay_hoan_thanh)}</td>
                            <td className="is-money">{formatCurrency(b.tong_tien)}</td>
                            <td className="is-money">{formatCurrency(b.tien_hoa_hong)}</td>
                            <td className="is-money is-emphasis is-partner-receive">
                              {formatCurrency(b.tien_doi_tac_nhan)}
                            </td>
                            <td>
                              <span className={`badge ${st.cls || 'badge-default'}`}>{st.label}</span>
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
