import { formatCurrency, formatDate } from '../../../../utils/bookingDisplay';

const BOOKING_STATUS = {
  da_thu: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

const PartnerPayoutBatchBookingsModal = ({ open, batch, bookings = [], onClose }) => {
  if (!open || !batch) return null;

  const title = batch.ten_dot
    ? `Danh sách đơn giao dịch — ${batch.ten_dot}`
    : 'Danh sách đơn giao dịch';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box finance-detail-modal payout-batch-bookings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-batch-bookings-title"
      >
        <div className="modal-header">
          <h3 id="payout-batch-bookings-title" className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="payout-batch-bookings-meta">
          <span>
            Mã TT:
            {' '}
            <strong>{batch.ma_gd_doi_tac || '—'}</strong>
          </span>
          <span>
            Số đơn:
            {' '}
            <strong>{bookings.length}</strong>
          </span>
        </div>

        <div className="finance-detail-modal-body payout-batch-bookings-body">
          {bookings.length === 0 ? (
            <p className="partner-finance-payout-empty">Không có đơn trong đợt này</p>
          ) : (
            <table className="data-table payout-batch-bookings-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách sạn</th>
                  <th>Ngày HT</th>
                  <th className="is-money">Tổng tiền</th>
                  <th className="is-money">Hoa hồng</th>
                  <th className="is-money">Đối tác nhận</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((bk) => {
                  const st = BOOKING_STATUS[bk.trang_thai] || {
                    label: bk.trang_thai || '—',
                    cls: '',
                  };
                  return (
                    <tr key={bk.ma_hoa_hong || `${bk.ma_don_hang}-${bk.tien_hoa_hong}`}>
                      <td>
                        <span className="mgmt-cell-code">{bk.ma_don_hang}</span>
                      </td>
                      <td>
                        <span className="payout-batch-hotel" title={bk.khach_san}>
                          {bk.khach_san}
                        </span>
                      </td>
                      <td className="is-date">{formatDate(bk.ngay_hoan_thanh)}</td>
                      <td className="is-money">{formatCurrency(bk.tong_tien)}</td>
                      <td className="is-money">{formatCurrency(bk.tien_hoa_hong)}</td>
                      <td className="is-money is-partner-receive">
                        {formatCurrency(bk.tien_doi_tac_nhan)}
                      </td>
                      <td>
                        <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="finance-detail-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPayoutBatchBookingsModal;
