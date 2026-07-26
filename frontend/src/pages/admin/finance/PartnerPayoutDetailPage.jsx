import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye } from 'lucide-react';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import PartnerPayoutBatchBookingsModal from './components/PartnerPayoutBatchBookingsModal';
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

const getBatchKey = (batch) =>
  batch.ma_dot || `${batch.ma_doi_tac}-${batch.ma_gd_doi_tac || batch.trang_thai}`;

const getBookingsForBatch = (batch, bookings) => {
  if (batch.trang_thai === 'cho_thanh_toan') {
    return bookings.filter(
      (bk) => bk.trang_thai === 'da_thu' || bk.ten_dot === 'Đợt chờ thanh toán',
    );
  }
  if (batch.trang_thai === 'tam_giu') {
    return bookings.filter(
      (bk) => bk.trang_thai === 'tam_giu' || bk.ten_dot === 'Đợt tạm giữ',
    );
  }
  if (batch.ma_gd_doi_tac) {
    return bookings.filter((bk) => bk.ma_gd_doi_tac === batch.ma_gd_doi_tac);
  }
  if (batch.ten_dot) {
    return bookings.filter((bk) => bk.ten_dot === batch.ten_dot);
  }
  return [];
};

const toDateKey = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const matchesPaidDate = (ngayThanhToan, filterDate) => {
  if (!filterDate) return true;
  return toDateKey(ngayThanhToan) === filterDate;
};

const BatchTable = ({ batches, onView }) => (
  <div className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card payout-table-wrap">
    <div className="mgmt-table-scroll partner-finance-table-scroll">
      <table className="data-table payout-finance-table">
        <thead>
          <tr>
            <th>Đợt</th>
            <th>Mã thanh toán</th>
            <th className="is-num">Số đơn</th>
            <th className="is-money">Doanh thu</th>
            <th className="is-money">Hoa hồng</th>
            <th className="is-money">Số tiền</th>
            <th>Ngày TT</th>
            <th>Trạng thái</th>
            <th className="is-action">Hành động</th>
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
              <tr key={getBatchKey(b)}>
                <td>{b.ten_dot || '—'}</td>
                <td>
                  <span className="mgmt-cell-code">{b.ma_gd_doi_tac || '—'}</span>
                </td>
                <td className="is-num">{b.so_don ?? b.so_don_da_doi_soat}</td>
                <td className="is-money">{formatCurrency(b.tong_doanh_thu)}</td>
                <td className="is-money">{formatCurrency(b.tong_hoa_hong)}</td>
                <td className="is-money is-emphasis">{formatCurrency(amount)}</td>
                <td>{formatDate(b.ngay_thanh_toan)}</td>
                <td>
                  <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                </td>
                <ActionCell>
                  <ActionButton
                    variant="view"
                    icon={Eye}
                    title="Xem chi tiết"
                    onClick={() => onView(b)}
                  />
                </ActionCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const PartnerPayoutDetailPage = () => {
  const { maDoiTac } = useParams();
  const dispatch = useDispatch();
  const { partnerPayoutDetail: detail, partnerPayoutDetailLoading: loading } = useSelector(
    (s) => s.adminFinance || {},
  );
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [paidDateFilter, setPaidDateFilter] = useState('');
  const [filterPartnerId, setFilterPartnerId] = useState(maDoiTac);

  if (maDoiTac !== filterPartnerId) {
    setFilterPartnerId(maDoiTac);
    setPaidDateFilter('');
  }

  useEffect(() => {
    if (maDoiTac) dispatch(fetchPartnerPayoutById(maDoiTac));
    return () => {
      dispatch(clearPartnerPayoutDetail());
    };
  }, [maDoiTac, dispatch]);

  const status = useMemo(() => {
    if (!detail) return { label: '—', cls: '' };
    return PAYOUT_STATUS[detail.trang_thai] || {
      label: detail.trang_thai || '—',
      cls: '',
    };
  }, [detail]);

  const { unpaidBatches, paidBatches } = useMemo(() => {
    const all = detail?.batches || [];
    return {
      unpaidBatches: all.filter(
        (b) => b.trang_thai === 'cho_thanh_toan' || b.trang_thai === 'tam_giu',
      ),
      paidBatches: all.filter((b) => b.trang_thai === 'da_thanh_toan'),
    };
  }, [detail?.batches]);

  const filteredPaidBatches = useMemo(
    () => paidBatches.filter((b) => matchesPaidDate(b.ngay_thanh_toan, paidDateFilter)),
    [paidBatches, paidDateFilter],
  );

  const modalBookings = useMemo(() => {
    if (!selectedBatch) return [];
    return getBookingsForBatch(selectedBatch, detail?.bookings || []);
  }, [selectedBatch, detail?.bookings]);

  const handleClearPaidDateFilter = () => {
    setPaidDateFilter('');
  };

  return (
    <div className="mgmt-page partner-finance-page partner-finance-payout-detail-page">
      <ManagementHeader
        title="Chi tiết thanh toán đối tác"
        backTo="/admin/finance?tab=partner"
        backLabel="Quay lại"
      />

      {loading && !detail ? (
        <div className="partner-finance-loading">Đang tải chi tiết thanh toán...</div>
      ) : !detail ? (
        <div className="empty-state">
          <p className="empty-state-text">Không tìm thấy dữ liệu thanh toán đối tác</p>
        </div>
      ) : (
        <>
          <section className="partner-finance-payout-section content-card payout-overview">
            <div className="payout-overview-identity">
              <div className="payout-overview-identity-main">
                <span className="payout-overview-kicker">Đối tác</span>
                <h2 className="payout-overview-name">
                  {detail.ten_cong_ty || `Đối tác #${detail.ma_doi_tac}`}
                </h2>
                <p className="payout-overview-meta">
                  Mã #{detail.ma_doi_tac}
                  {' · '}
                  {detail.so_khach_san ?? 0} khách sạn
                  {' · '}
                  {detail.tong_so_don ?? detail.bookings?.length ?? 0} đơn
                </p>
              </div>
              <span className={`mgmt-status-text ${status.cls}`}>{status.label}</span>
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
                  {formatCurrency(detail.tien_doi_tac_nhan)}
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
                  {formatCurrency(detail.con_cho_nhan ?? detail.so_tien_can_thanh_toan)}
                </strong>
              </div>
              <div className="payout-debt-item">
                <span className="payout-debt-label">Ngày thanh toán gần nhất</span>
                <strong className="payout-debt-value">
                  {formatDate(detail.ngay_thanh_toan)}
                </strong>
              </div>
            </div>
          </section>

          <section className="partner-finance-payout-section content-card">
            <h4>Các đợt chưa thanh toán</h4>
            {unpaidBatches.length === 0 ? (
              <p className="partner-finance-payout-empty">Không có đợt chờ thanh toán</p>
            ) : (
              <BatchTable batches={unpaidBatches} onView={setSelectedBatch} />
            )}
          </section>

          <section className="partner-finance-payout-section content-card">
            <div className="payout-paid-section-header">
              <h4>Các đợt đã thanh toán</h4>
              <div className="payout-paid-date-filter">
                <label className="payout-paid-date-field">
                  <span>Ngày thanh toán</span>
                  <input
                    type="date"
                    value={paidDateFilter}
                    onChange={(e) => setPaidDateFilter(e.target.value)}
                  />
                </label>
                <div className="payout-paid-date-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleClearPaidDateFilter}
                  >
                    Xóa lọc
                  </button>
                </div>
              </div>
            </div>
            {paidBatches.length === 0 ? (
              <p className="partner-finance-payout-empty">Chưa có đợt thanh toán</p>
            ) : filteredPaidBatches.length === 0 ? (
              <p className="partner-finance-payout-empty">
                Không có đợt thanh toán vào ngày đã chọn
              </p>
            ) : (
              <BatchTable batches={filteredPaidBatches} onView={setSelectedBatch} />
            )}
          </section>

          <PartnerPayoutBatchBookingsModal
            open={Boolean(selectedBatch)}
            batch={selectedBatch}
            bookings={modalBookings}
            onClose={() => setSelectedBatch(null)}
          />
        </>
      )}
    </div>
  );
};

export default PartnerPayoutDetailPage;
