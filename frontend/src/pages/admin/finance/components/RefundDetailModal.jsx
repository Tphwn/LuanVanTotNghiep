import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveRefund,
  clearRefundDetail,
  fetchRefundById,
} from '../../../../store/slices/adminFinanceSlice';
import { formatCurrency } from '../../../../utils/bookingDisplay';
import RefundDetailBody from './RefundDetailBody';

export default function RefundDetailModal({ id, onClose }) {
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    refundDetail,
    refundDetailLoading,
    loading,
  } = useSelector((s) => s.adminFinance || {});

  useEffect(() => {
    if (id) dispatch(fetchRefundById(id));
    return () => { dispatch(clearRefundDetail()); };
  }, [dispatch, id]);

  const canApprove = refundDetail
    && ['cho_xu_ly', 'dang_xu_ly'].includes(refundDetail.trang_thai);

  const handleConfirmRefund = () => {
    dispatch(approveRefund(refundDetail.ma_hoan_tien)).finally(() => {
      setConfirmOpen(false);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal refund-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header refund-detail-modal-top">
          <h3 className="modal-title">Chi tiết hoàn tiền</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {refundDetailLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
              Đang tải chi tiết yêu cầu hoàn tiền...
            </div>
          ) : !refundDetail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
              Không tìm thấy yêu cầu hoàn tiền
            </div>
          ) : (
            <RefundDetailBody
              refundDetail={refundDetail}
              canApprove={canApprove}
              loading={loading}
              onApproveClick={() => setConfirmOpen(true)}
              onClose={onClose}
            />
          )}
        </div>
      </div>

      {confirmOpen && refundDetail && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); }}
          role="presentation"
        >
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận hoàn tiền</h3>
              <button type="button" className="modal-close" onClick={() => setConfirmOpen(false)}>×</button>
            </div>
            <p style={{ fontSize: 14, color: '#1a2e28', lineHeight: 1.6, margin: '0 0 16px' }}>
              Bạn có chắc muốn hoàn{' '}
              <strong>{formatCurrency(refundDetail.so_tien_hoan)}</strong>{' '}
              cho khách <strong>{refundDetail.khach_hang_ten}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={handleConfirmRefund}
              >
                Xác nhận hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
