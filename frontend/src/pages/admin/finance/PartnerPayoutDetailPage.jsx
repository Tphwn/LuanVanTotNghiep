import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import PayoutPeriodDetailView from '../../../components/finance/PayoutPeriodDetailView';
import {
  fetchPartnerPayoutById,
  clearPartnerPayoutDetail,
} from '../../../store/slices/adminFinanceSlice';

const pickDefaultBatch = (batches = []) => {
  const pending = batches.find((b) => b.trang_thai === 'cho_thanh_toan');
  if (pending) return pending;
  const paid = [...batches]
    .filter((b) => b.trang_thai === 'da_thanh_toan')
    .sort((a, b) => {
      const ta = a.ngay_thanh_toan ? new Date(a.ngay_thanh_toan).getTime() : 0;
      const tb = b.ngay_thanh_toan ? new Date(b.ngay_thanh_toan).getTime() : 0;
      return tb - ta;
    });
  return paid[0] || null;
};

const buildPeriodDetail = (detail, batch) => {
  if (!detail || !batch) return null;

  const bookings = (detail.bookings || []).filter((bk) => {
    if (batch.trang_thai === 'cho_thanh_toan') {
      return bk.trang_thai === 'da_thu' || bk.ma_dot === batch.ma_dot;
    }
    if (batch.ma_gd_doi_tac) return bk.ma_gd_doi_tac === batch.ma_gd_doi_tac;
    return bk.ma_dot === batch.ma_dot;
  });

  const proofFromBooking = bookings.find((b) => b.minh_chung?.ma_giao_dich)?.minh_chung;

  return {
    ...batch,
    ten_cong_ty: detail.ten_cong_ty,
    tai_khoan_ngan_hang: detail.tai_khoan_ngan_hang,
    danh_sach_khach_san: batch.danh_sach_khach_san?.length
      ? batch.danh_sach_khach_san
      : [...new Set(bookings.map((b) => b.khach_san).filter((x) => x && x !== '—'))],
    ma_phieu_thanh_toan: batch.trang_thai === 'da_thanh_toan'
      ? (batch.ma_gd_doi_tac || batch.ma_dot)
      : null,
    minh_chung: batch.minh_chung || proofFromBooking || {
      phuong_thuc: null,
      ma_giao_dich: null,
      ghi_chu: null,
    },
    bookings,
  };
};

const PartnerPayoutDetailPage = () => {
  const { maDoiTac } = useParams();
  const [searchParams] = useSearchParams();
  const maDotParam = searchParams.get('ma_dot');
  const dispatch = useDispatch();
  const { partnerPayoutDetail: detail, partnerPayoutDetailLoading: loading } = useSelector(
    (s) => s.adminFinance || {},
  );

  useEffect(() => {
    if (maDoiTac) dispatch(fetchPartnerPayoutById(maDoiTac));
    return () => {
      dispatch(clearPartnerPayoutDetail());
    };
  }, [maDoiTac, dispatch]);

  const selectedBatch = useMemo(() => {
    const batches = detail?.batches || [];
    if (!batches.length) return null;
    if (maDotParam) {
      const found = batches.find((b) => String(b.ma_dot) === String(maDotParam));
      if (found) return found;
    }
    return pickDefaultBatch(batches);
  }, [detail?.batches, maDotParam]);

  const periodDetail = useMemo(
    () => buildPeriodDetail(detail, selectedBatch),
    [detail, selectedBatch],
  );

  return (
    <div className="mgmt-page partner-finance-page partner-finance-payout-detail-page">
      <ManagementHeader
        title="Chi tiết thanh toán đối tác"
        backTo="/admin/finance?tab=partner"
        backLabel="Quay lại"
      />

      {loading && !detail ? (
        <div className="partner-finance-loading">Đang tải chi tiết thanh toán...</div>
      ) : !detail || !periodDetail ? (
        <div className="empty-state">
          <p className="empty-state-text">Không tìm thấy dữ liệu thanh toán đối tác</p>
        </div>
      ) : (
        <PayoutPeriodDetailView detail={periodDetail} />
      )}
    </div>
  );
};

export default PartnerPayoutDetailPage;
