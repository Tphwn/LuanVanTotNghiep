import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import {
  approveRefund,
  clearMsg,
  clearRefundDetail,
  fetchRefundById,
} from '../../../store/slices/adminFinanceSlice';
import { formatCurrency } from '../../../utils/bookingDisplay';
import RefundDetailBody from './components/RefundDetailBody';

export default function RefundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    refundDetail,
    refundDetailLoading,
    loading,
    successMsg,
    error,
  } = useSelector((s) => s.adminFinance || {});

  useEffect(() => {
    if (id) dispatch(fetchRefundById(id));
    return () => { dispatch(clearRefundDetail()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const handleBack = () => {
    navigate(location.state?.returnTo || '/admin/finance?tab=refunds');
  };

  const canApprove = refundDetail
    && ['cho_xu_ly', 'dang_xu_ly'].includes(refundDetail.trang_thai);

  const handleConfirmRefund = () => {
    dispatch(approveRefund(refundDetail.ma_hoan_tien)).finally(() => {
      setConfirmOpen(false);
    });
  };

  if (refundDetailLoading) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 60 }}>
        Đang tải chi tiết yêu cầu hoàn tiền...
      </div>
    );
  }

  if (!refundDetail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy yêu cầu hoàn tiền</p>
        <BackButton variant="outline" onClick={handleBack} />
      </div>
    );
  }

  return (
    <div className="booking-detail-page mgmt-page">
      <ManagementHeader
        title="Tài chính"
        subtitle={`Chi tiết hoàn tiền ${refundDetail.ma_hoan || `#${refundDetail.ma_hoan_tien}`}`}
        onBack={handleBack}
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <RefundDetailBody
          refundDetail={refundDetail}
          canApprove={canApprove}
          loading={loading}
          onApproveClick={() => setConfirmOpen(true)}
          onClose={handleBack}
        />
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
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
