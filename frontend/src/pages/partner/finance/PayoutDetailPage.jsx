import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import PayoutPeriodDetailView from '../../../components/finance/PayoutPeriodDetailView';

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
        <PayoutPeriodDetailView detail={detail} />
      )}
    </div>
  );
};

export default PayoutDetailPage;
