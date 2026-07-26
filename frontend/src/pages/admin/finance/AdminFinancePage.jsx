 import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchFinanceOverview,
  fetchTransactions,
  fetchRefunds,
  fetchCommissions,
  fetchCommissionStats,
  fetchCommissionById,
  confirmCommission,
  holdCommission,
  releaseCommissionHold,
  fetchPartnerPayouts,
  fetchPartnerPayoutStats,
  confirmPartnerPayout,
  releasePartnerPayoutHold,
  clearMsg,
} from '../../../store/slices/adminFinanceSlice';
import { Eye, Check, Pause, Play } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import { REFUND_TRANG_THAI } from '../../../utils/bookingDisplay';
import TransactionDetailModal from './components/TransactionDetailModal';
import RefundDetailModal from './components/RefundDetailModal';
import CommissionDetailModal from './components/CommissionDetailModal';
import PartnerPayoutConfirmModal from './components/PartnerPayoutConfirmModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import AdminFinanceOverviewPanel from './AdminFinanceOverviewPanel';

// ===== HELPERS =====
const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const fmtPaymentDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${date.toLocaleDateString('vi-VN')} ${time}`;
};

const formatTxCustomer = (tx) => {
  const name = tx.khach_hang_ten || tx.dat_phong?.khach_hang?.ho_ten || tx.dat_phong?.ten_nguoi_nhan;
  const phone = tx.khach_hang_sdt || tx.dat_phong?.sdt_nguoi_nhan;
  if (!name) return '—';
  return phone ? `${name} (${phone})` : name;
};

const getTxHotelName = (tx) =>
  tx.dat_phong?.loai_phong?.khach_san?.ten || '—';

const getTxRoomType = (tx) =>
  tx.dat_phong?.loai_phong?.ten_loai || '—';

const TX_STATUS = {
  thanh_cong:   { label: 'Thành công', cls: 'badge-success' },
  that_bai:     { label: 'Thất bại', cls: 'badge-danger' },
  da_hoan_tien: { label: 'Đã hoàn tiền', cls: 'badge-info' },
  hoan_thanh:   { label: 'Hoàn thành', cls: 'badge-success' },
  cho:          { label: 'Chờ', cls: 'badge-warning' },
};

const REFUND_STATUS = REFUND_TRANG_THAI;

const COMM_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'badge-warning' },
  da_thu: { label: 'Đã đối soát', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
  da_thanh_toan: { label: 'Đã thanh toán ĐT', cls: 'badge-info' },
};

const StatCard = ({ title, value, subtitle, tone }) => (
  <div className={`admin-finance-metric${tone ? ` admin-finance-metric--${tone}` : ''}`}>
    <span className="admin-finance-metric-label">{title}</span>
    <strong className="admin-finance-metric-value">{value}</strong>
    <span className={`admin-finance-metric-sub${subtitle ? '' : ' is-empty'}`}>
      {subtitle || '\u00A0'}
    </span>
  </div>
);

const inputSt = {
  padding:'9px 12px', border:'1px solid #d4ede6',
  borderRadius:8, fontSize:14, outline:'none',
  fontFamily:'inherit', background:'#fff',
};

const FINANCE_TABS = ['overview', 'transactions', 'refunds', 'commissions', 'partner'];

const AdminFinancePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    overview,
    transactions,
    refunds,
    commissions,
    commissionStats,
    partnerPayouts,
    partnerPayoutStats,
    loading,
    error,
    successMsg,
  } = useSelector((s) => s.adminFinance || {});

  const initialTab = searchParams.get('tab');
  const tab = FINANCE_TABS.includes(initialTab) ? initialTab : 'overview';

  const handleTabChange = (tabId) => {
    if (tabId === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  const [txModalId, setTxModalId] = useState(null);
  const [refundModalId, setRefundModalId] = useState(null);
  const [commModalId, setCommModalId] = useState(null);
  const [commAction, setCommAction] = useState(null);
  const [commActionLoading, setCommActionLoading] = useState(false);
  const [payoutAction, setPayoutAction] = useState(null);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [payoutFormError, setPayoutFormError] = useState('');

  const goToTransactionDetail = (id) => setTxModalId(id);

  const goToRefundDetail = (id) => setRefundModalId(id);

  // Filters
  const [txFilter, setTxFilter]   = useState({ trang_thai:'all', phuong_thuc:'all', tu_ngay:'', den_ngay:'', keyword:''});
  const [rfFilter, setRfFilter]   = useState({ trang_thai:'all', tu_ngay:'', den_ngay:'', keyword:''});
  const [commFilter, setCommFilter] = useState({
    doi_tac_id: 'all',
    khach_san_id: 'all',
    trang_thai: 'all',
    tu_ngay: '',
    den_ngay: '',
  });
  const [payoutFilter, setPayoutFilter] = useState({
    doi_tac_id: 'all',
    khach_san_id: 'all',
    trang_thai: 'all',
  });

  const loadCommissions = (filters = commFilter) => {
    dispatch(fetchCommissions(filters));
    dispatch(fetchCommissionStats(filters));
  };

  const loadPartnerPayouts = (filters = payoutFilter) => {
    dispatch(fetchPartnerPayouts(filters));
    dispatch(fetchPartnerPayoutStats(filters));
  };

  useEffect(() => {
    dispatch(fetchFinanceOverview());
    dispatch(fetchTransactions());
    dispatch(fetchRefunds());
    dispatch(fetchCommissions());
    dispatch(fetchCommissionStats());
    dispatch(fetchPartnerPayouts({ trang_thai: 'all' }));
    dispatch(fetchPartnerPayoutStats({}));
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  useEffect(() => {
    if (!successMsg) return;
    if (tab === 'commissions') loadCommissions();
    if (tab === 'partner') loadPartnerPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMsg]);

  useEffect(() => {
    if (tab !== 'transactions') return undefined;
    const t = setTimeout(() => dispatch(fetchTransactions(txFilter)), 300);
    return () => clearTimeout(t);
  }, [tab, txFilter, dispatch]);

  useEffect(() => {
    if (tab !== 'refunds') return undefined;
    const t = setTimeout(() => dispatch(fetchRefunds(rfFilter)), 300);
    return () => clearTimeout(t);
  }, [tab, rfFilter, dispatch]);

  useEffect(() => {
    if (tab !== 'commissions') return undefined;
    const t = setTimeout(() => loadCommissions(commFilter), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, commFilter]);

  useEffect(() => {
    if (tab !== 'partner') return undefined;
    const t = setTimeout(() => loadPartnerPayouts(payoutFilter), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, payoutFilter]);

  const handleConfirmCommAction = async () => {
    if (!commAction) return;
    setCommActionLoading(true);
    try {
      if (commAction.type === 'confirm') {
        await dispatch(confirmCommission(commAction.id)).unwrap();
      } else if (commAction.type === 'hold') {
        await dispatch(holdCommission(commAction.id)).unwrap();
      } else if (commAction.type === 'release') {
        await dispatch(releaseCommissionHold(commAction.id)).unwrap();
      }
      setCommAction(null);
      if (commModalId) {
        dispatch(fetchCommissionById(commModalId));
      }
      loadCommissions();
    } catch {
      // error handled in slice
    } finally {
      setCommActionLoading(false);
    }
  };

  const handleConfirmPayoutAction = async () => {
    if (!payoutAction || payoutAction.type !== 'release') return;
    setPayoutActionLoading(true);
    try {
      await dispatch(releasePartnerPayoutHold(payoutAction.id)).unwrap();
      setPayoutAction(null);
      loadPartnerPayouts();
    } catch {
      // handled in slice
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleConfirmPayoutPayment = async (form) => {
    if (!payoutAction || payoutAction.type !== 'confirm') return;
    setPayoutActionLoading(true);
    setPayoutFormError('');
    try {
      await dispatch(confirmPartnerPayout({
        maDoiTac: payoutAction.id,
        ...form,
      })).unwrap();
      setPayoutAction(null);
      loadPartnerPayouts();
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Xác nhận thanh toán thất bại');
      setPayoutFormError(msg);
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'transactions', label: 'Giao dịch' },
    { id: 'refunds', label: 'Hoàn tiền' },
    { id: 'commissions', label: 'Hoa hồng' },
    { id: 'partner', label: 'Thanh Toán Đối Tác' },
  ];

  const pendingRefunds = refunds.filter(r => r.trang_thai === 'cho_xu_ly').length;

  const txPg = useListPagination(transactions, 10, [transactions]);
  const rfPg = useListPagination(refunds, 10, [refunds]);
  const commPg = useListPagination(commissions, 10, [commissions]);

  const partnerPayoutSummaries = useMemo(() => {
    const map = new Map();
    for (const row of partnerPayouts || []) {
      const id = row.ma_doi_tac;
      if (!map.has(id)) {
        map.set(id, {
          ma_doi_tac: id,
          ten_cong_ty: row.ten_cong_ty || `Đối tác #${id}`,
          tong_doanh_thu: 0,
          tong_hoa_hong: 0,
          da_thanh_toan: 0,
          cho_thanh_toan: 0,
          so_don_cho_tt: 0,
        });
      }
      const s = map.get(id);
      s.tong_doanh_thu += Number(row.tong_doanh_thu) || 0;
      s.tong_hoa_hong += Number(row.tong_hoa_hong) || 0;
      if (row.trang_thai === 'cho_thanh_toan') {
        s.cho_thanh_toan += Number(row.so_tien_can_thanh_toan) || 0;
        s.so_don_cho_tt += Number(row.so_don_cho_tt || row.so_don) || 0;
      } else if (row.trang_thai === 'da_thanh_toan') {
        s.da_thanh_toan += Number(row.so_tien_thanh_toan) || 0;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.cho_thanh_toan !== a.cho_thanh_toan) return b.cho_thanh_toan - a.cho_thanh_toan;
      return String(a.ten_cong_ty).localeCompare(String(b.ten_cong_ty), 'vi');
    });
  }, [partnerPayouts]);

  const payoutPg = useListPagination(partnerPayoutSummaries, 10, [partnerPayoutSummaries]);

  const payoutHotelsForPartner = useMemo(() => {
    const hotels = partnerPayoutStats?.hotels || [];
    if (!payoutFilter.doi_tac_id || payoutFilter.doi_tac_id === 'all') return [];
    return hotels.filter((h) => String(h.ma_doi_tac) === String(payoutFilter.doi_tac_id));
  }, [partnerPayoutStats?.hotels, payoutFilter.doi_tac_id]);

  const commissionHotelsForPartner = useMemo(() => {
    const hotels = commissionStats?.hotels || [];
    if (!commFilter.doi_tac_id || commFilter.doi_tac_id === 'all') return [];
    return hotels.filter((h) => String(h.ma_doi_tac) === String(commFilter.doi_tac_id));
  }, [commissionStats?.hotels, commFilter.doi_tac_id]);

  return (
    <div className="admin-finance-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý tài chính</h1>
          <p className="page-subtitle">Theo dõi doanh thu, giao dịch, hoàn tiền, hoa hồng và thanh toán đối tác.</p>
        </div>
      </div>
      <Toast
        toast={
          successMsg || error
            ? { message: successMsg || error, type: successMsg ? 'success' : 'error' }
            : null
        }
      />

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'0.5px solid #d4ede6', marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
            padding:'10px 20px', background:'none', border:'none',
            borderBottom: tab===t.id ? '2px solid #3C7363':'2px solid transparent',
            color: tab===t.id ? '#3C7363':'#5a7a72',
            fontWeight: tab===t.id ? 600 : 400,
            cursor:'pointer', fontSize:14, marginBottom:-1,
            display:'flex', alignItems:'center', gap:6,
          }}>
            {t.label}
            {t.id==='refunds'&& pendingRefunds > 0 && (
              <span style={{ background:'#e05c5c', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center'}}>
                {pendingRefunds}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <AdminFinanceOverviewPanel
          overview={overview}
          onGoRefunds={() => handleTabChange('refunds')}
          onGoCommissions={() => handleTabChange('commissions')}
          onGoPartner={() => handleTabChange('partner')}
          onGoTransactions={() => handleTabChange('transactions')}
          onViewTransaction={(id) => setTxModalId(id)}
        />
      )}

      {tab === 'transactions'&& (
        <>
          <div className="admin-finance-filters">
            <div className="mgmt-filter-field mgmt-filter-field--grow">
              <label className="mgmt-filter-label" htmlFor="tx-keyword">Tìm kiếm</label>
              <input
                id="tx-keyword"
                className="mgmt-select-inline"
                style={inputSt}
                placeholder="Mã GD, tham chiếu, mã đơn..."
                value={txFilter.keyword}
                onChange={(e) => setTxFilter({ ...txFilter, keyword: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="tx-status">Trạng thái</label>
              <select
                id="tx-status"
                className="mgmt-select-inline"
                style={inputSt}
                value={txFilter.trang_thai}
                onChange={(e) => setTxFilter({ ...txFilter, trang_thai: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="thanh_cong">Thành công</option>
                <option value="that_bai">Thất bại</option>
                <option value="da_hoan_tien">Đã hoàn tiền</option>
                <option value="hoan_thanh">Hoàn thành</option>
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="tx-method">Phương thức</label>
              <select
                id="tx-method"
                className="mgmt-select-inline"
                style={inputSt}
                value={txFilter.phuong_thuc}
                onChange={(e) => setTxFilter({ ...txFilter, phuong_thuc: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="truc_tuyen">Trực tuyến</option>
                <option value="tai_khach_san">Tại khách sạn</option>
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="tx-from">Từ ngày</label>
              <input
                id="tx-from"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={txFilter.tu_ngay}
                onChange={(e) => setTxFilter({ ...txFilter, tu_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="tx-to">Đến ngày</label>
              <input
                id="tx-to"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={txFilter.den_ngay}
                onChange={(e) => setTxFilter({ ...txFilter, den_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field mgmt-filter-field--action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTxFilter({ trang_thai: 'all', phuong_thuc: 'all', tu_ngay: '', den_ngay: '', keyword: '' })}
              >
                Xóa lọc
              </button>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách giao dịch ({transactions.length})</h3>
            </div>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#5a7a72'}}> Đang tải...</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Chưa có giao dịch</p></div>
            ) : (
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Mã đơn</th>
                    <th className="mgmt-col-hotel">Khách sạn / Phòng</th>
                    <th className="mgmt-col-customer">Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {txPg.pagedItems.map(tx => {
                    const st = TX_STATUS[tx.trang_thai] || { label: tx.trang_thai, cls:'badge-default'};
                    return (
                      <tr key={tx.ma_thanh_toan}>
                        <td className="mgmt-table-cell-code">
                          <span className="mgmt-cell-code">{tx.ma_giao_dich}</span>
                        </td>
                        <td>
                          <span className="mgmt-cell-code">{tx.ma_don_hang || tx.dat_phong?.ma_don_hang || '—'}</span>
                        </td>
                        <td className="mgmt-col-hotel">
                          <div className="mgmt-cell-name">{getTxHotelName(tx)}</div>
                          <div className="mgmt-cell-sub">Loại: {getTxRoomType(tx)}</div>
                        </td>
                        <td className="mgmt-col-customer">{formatTxCustomer(tx)}</td>
                        <td style={{ fontWeight:500 }}>{fmt(tx.so_tien)}</td>
                        <td style={{ whiteSpace:'nowrap' }}>{tx.phuong_thuc || '—'}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell compact>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Xem chi tiết"
                            onClick={() => goToTransactionDetail(tx.ma_thanh_toan)}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {txPg.showPagination && (
              <ListPagination
                total={transactions.length}
                currentPage={txPg.currentPage}
                totalPages={txPg.totalPages}
                rangeFrom={txPg.rangeFrom}
                rangeTo={txPg.rangeTo}
                pageNumbers={txPg.pageNumbers}
                onPageChange={txPg.setPage}
              />
            )}
          </div>
        </>
      )}

      {tab ==='refunds'&& (
        <>
          <div className="admin-finance-filters">
            <div className="mgmt-filter-field mgmt-filter-field--grow">
              <label className="mgmt-filter-label" htmlFor="rf-keyword">Tìm kiếm</label>
              <input
                id="rf-keyword"
                className="mgmt-select-inline"
                style={inputSt}
                placeholder="Mã đơn hoặc tên khách hàng..."
                value={rfFilter.keyword}
                onChange={(e) => setRfFilter({ ...rfFilter, keyword: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="rf-status">Trạng thái</label>
              <select
                id="rf-status"
                className="mgmt-select-inline"
                style={inputSt}
                value={rfFilter.trang_thai}
                onChange={(e) => setRfFilter({ ...rfFilter, trang_thai: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="cho_xu_ly">Chờ xử lý</option>
                <option value="dang_xu_ly">Đang xử lý</option>
                <option value="da_hoan">Đã hoàn</option>
                <option value="tu_choi">Từ chối</option>
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="rf-from">Từ ngày</label>
              <input
                id="rf-from"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={rfFilter.tu_ngay}
                onChange={(e) => setRfFilter({ ...rfFilter, tu_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="rf-to">Đến ngày</label>
              <input
                id="rf-to"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={rfFilter.den_ngay}
                onChange={(e) => setRfFilter({ ...rfFilter, den_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field mgmt-filter-field--action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRfFilter({ trang_thai: 'all', tu_ngay: '', den_ngay: '', keyword: '' })}
              >
                Xóa lọc
              </button>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Yêu cầu hoàn tiền ({refunds.length})</h3>
              {pendingRefunds > 0 && <span className="badge badge-warning">{pendingRefunds} chờ xử lý</span>}
            </div>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#5a7a72' }}>Đang tải...</div>
            ) : refunds.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Chưa có yêu cầu hoàn tiền</p></div>
            ) : (
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th>Mã hoàn</th>
                    <th>Mã đơn</th>
                    <th className="mgmt-col-customer">Khách hàng</th>
                    <th>Số tiền hoàn</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th className="table-action-cell--compact" scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rfPg.pagedItems.map(r => {
                    const st = REFUND_STATUS[r.trang_thai] || { label:r.trang_thai, cls:'badge-default'};
                    const customerName = r.khach_hang_ten || r.dat_phong?.khach_hang?.ho_ten || '—';
                    return (
                      <tr key={r.ma_hoan_tien}>
                        <td className="mgmt-table-cell-code">
                          <span className="mgmt-cell-code">{r.ma_hoan || `HT-${String(r.ma_hoan_tien).padStart(6, '0')}`}</span>
                        </td>
                        <td>
                          <span className="mgmt-cell-code">{r.ma_don_hang || r.dat_phong?.ma_don_hang || '—'}</span>
                        </td>
                        <td className="mgmt-col-customer">{customerName}</td>
                        <td style={{ fontWeight:500, color:'#e05c5c' }}>{fmt(r.so_tien_hoan)}</td>
                        <td style={{ fontSize:13, color:'#5a7a72', whiteSpace:'nowrap' }}>{fmtPaymentDateTime(r.ngay_yeu_cau)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell compact>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Xem chi tiết"
                            onClick={() => goToRefundDetail(r.ma_hoan_tien)}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {rfPg.showPagination && (
              <ListPagination
                total={refunds.length}
                currentPage={rfPg.currentPage}
                totalPages={rfPg.totalPages}
                rangeFrom={rfPg.rangeFrom}
                rangeTo={rfPg.rangeTo}
                pageNumbers={rfPg.pageNumbers}
                onPageChange={rfPg.setPage}
              />
            )}
          </div>
        </>
      )}

      {/* ===== HOA HỒNG ===== */}
      {tab === 'commissions' && (
        <>
          <div className="admin-finance-metrics admin-finance-metrics--6">
            <StatCard
              title="Tổng hoa hồng hệ thống"
              value={fmt(commissionStats?.tong_hoa_hong_he_thong)}
              subtitle="Tiền hệ thống giữ lại"
              tone="neutral"
            />
            <StatCard
              title="Doanh thu hợp lệ"
              value={fmt(commissionStats?.doanh_thu_hop_le)}
              subtitle="Đơn đã tính hoa hồng"
              tone="info"
            />
            <StatCard
              title="Số đơn tính hoa hồng"
              value={`${commissionStats?.so_don_da_tinh || 0}`}
              subtitle="Đơn hoàn thành hợp lệ"
            />
            <StatCard
              title="Chờ đối soát"
              value={`${commissionStats?.cho_doi_soat || 0}`}
              subtitle="Chưa xác nhận"
              tone="warning"
            />
            <StatCard
              title="Đã đối soát"
              value={`${commissionStats?.da_doi_soat || 0}`}
              subtitle="Chờ thanh toán đối tác"
              tone="success"
            />
            <StatCard
              title="Tạm giữ"
              value={`${commissionStats?.tam_giu || 0}`}
              subtitle="Đang tạm khóa"
              tone="danger"
            />
          </div>

          <div className="admin-finance-filters">
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="comm-partner">Đối tác</label>
              <select
                id="comm-partner"
                className="mgmt-select-inline"
                style={inputSt}
                value={commFilter.doi_tac_id}
                onChange={(e) => setCommFilter({
                  ...commFilter,
                  doi_tac_id: e.target.value,
                  khach_san_id: 'all',
                })}
              >
                <option value="all">Tất cả</option>
                {(commissionStats?.partners || []).map((p) => (
                  <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten_cong_ty}</option>
                ))}
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="comm-hotel">Khách sạn</label>
              <select
                id="comm-hotel"
                className="mgmt-select-inline"
                style={inputSt}
                value={commFilter.khach_san_id}
                disabled={commFilter.doi_tac_id === 'all'}
                onChange={(e) => setCommFilter({ ...commFilter, khach_san_id: e.target.value })}
              >
                <option value="all">
                  {commFilter.doi_tac_id === 'all' ? '' : 'Tất cả khách sạn của đối tác'}
                </option>
                {commissionHotelsForPartner.map((h) => (
                  <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                ))}
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="comm-status">Trạng thái đối soát</label>
              <select
                id="comm-status"
                className="mgmt-select-inline"
                style={inputSt}
                value={commFilter.trang_thai}
                onChange={(e) => setCommFilter({ ...commFilter, trang_thai: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="chua_thu">Chờ đối soát</option>
                <option value="da_thu">Đã đối soát</option>
                <option value="tam_giu">Tạm giữ</option>
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="comm-from">Từ ngày trả</label>
              <input
                id="comm-from"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={commFilter.tu_ngay}
                onChange={(e) => setCommFilter({ ...commFilter, tu_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="comm-to">Đến ngày trả</label>
              <input
                id="comm-to"
                type="date"
                className="mgmt-select-inline"
                style={inputSt}
                value={commFilter.den_ngay}
                onChange={(e) => setCommFilter({ ...commFilter, den_ngay: e.target.value })}
              />
            </div>
            <div className="mgmt-filter-field mgmt-filter-field--action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setCommFilter({
                    doi_tac_id: 'all',
                    khach_san_id: 'all',
                    trang_thai: 'all',
                    tu_ngay: '',
                    den_ngay: '',
                  });
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>
{/* ===== HOA HỒNG ===== */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách hoa hồng ({commissions.length})</h3>
            </div>
            {commissions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">
                  Chưa có hoa hồng. 
                </p>
              </div>
            ) : (
              <div className="mgmt-table-scroll">
                <table className="data-table data-table-grid admin-mgmt-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th className="mgmt-col-hotel">Khách sạn</th>
                      <th className="mgmt-col-name">Đối tác</th>
                      <th>Ngày hoàn</th>
                      <th>Tổng tiền đơn</th>
                      <th>Tỷ lệ HH</th>
                      <th>Tiền hoa hồng</th>
                      <th>Tiền đối tác nhận</th>
                      <th>Trạng thái đối soát</th>
                      <th className="table-action-cell--compact" scope="col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commPg.pagedItems.map((c) => {
                      const st = COMM_STATUS[c.trang_thai] || { label: c.trang_thai, cls: 'badge-default' };
                      const doanhThu = c.doanh_thu_don ?? c.dat_phong?.thanh_toan_cuoi;
                      const tienDoiTac = c.tien_doi_tac_nhan
                        ?? Math.max(0, Number(doanhThu || 0) - Number(c.so_tien_hoa_hong || 0));
                      return (
                        <tr key={c.ma_hoa_hong}>
                          <td className="mgmt-table-cell-code">#{c.dat_phong?.ma_don_hang}</td>
                          <td className="mgmt-col-hotel">{c.dat_phong?.loai_phong?.khach_san?.ten || '—'}</td>
                          <td className="mgmt-col-name">{c.doi_tac?.ten_cong_ty || '—'}</td>
                          <td style={{ fontSize: 13, color: '#5a7a72' }}>
                            {fmtDate(c.ngay_hoan_thanh || c.dat_phong?.ngay_tra_phong)}
                          </td>
                          <td>{fmt(doanhThu)}</td>
                          <td>{c.ty_le_hoa_hong}%</td>
                          <td style={{ fontWeight: 600, color: '#b36b00' }}>{fmt(c.so_tien_hoa_hong)}</td>
                          <td style={{ fontWeight: 500, color: '#3C7363' }}>{fmt(tienDoiTac)}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <ActionCell>
                            <ActionButton
                              variant="view"
                              iconOnly
                              icon={Eye}
                              title="Xem chi tiết"
                              onClick={() => setCommModalId(c.ma_hoa_hong)}
                            />
                          </ActionCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {commPg.showPagination && (
              <ListPagination
                total={commissions.length}
                currentPage={commPg.currentPage}
                totalPages={commPg.totalPages}
                rangeFrom={commPg.rangeFrom}
                rangeTo={commPg.rangeTo}
                pageNumbers={commPg.pageNumbers}
                onPageChange={commPg.setPage}
              />
            )}
          </div>
        </>
      )}

      {/* ===== THANH TOÁN ĐỐI TÁC ===== */}
      {tab === 'partner' && (
        <>
          <div className="admin-finance-metrics admin-finance-metrics--4">
            <StatCard
              title="Tổng tiền chờ thanh toán"
              value={fmt(partnerPayoutStats?.tong_cho_thanh_toan)}
              subtitle="Sau khi trừ hoa hồng hệ thống"
              tone="warning"
            />
            <StatCard
              title="Tổng tiền đã thanh toán"
              value={fmt(partnerPayoutStats?.tong_da_thanh_toan)}
              subtitle="Các đợt đã chuyển đối tác"
              tone="success"
            />
            <StatCard
              title="Số đối tác chờ thanh toán"
              value={`${partnerPayoutStats?.so_doi_tac_cho || 0}`}
              subtitle="Có đợt chờ xử lý"
              tone="info"
            />
            <StatCard
              title="Số kỳ thanh toán tạm giữ"
              value={`${partnerPayoutStats?.so_ky_tam_giu || 0}`}
              subtitle="Đơn đang tạm khóa"
              tone="danger"
            />
          </div>

          <div className="admin-finance-filters">
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="payout-partner">Đối tác</label>
              <select
                id="payout-partner"
                className="mgmt-select-inline"
                style={inputSt}
                value={payoutFilter.doi_tac_id}
                onChange={(e) => setPayoutFilter({
                  ...payoutFilter,
                  doi_tac_id: e.target.value,
                  khach_san_id: 'all',
                })}
              >
                <option value="all">Tất cả</option>
                {(partnerPayoutStats?.partners || []).map((p) => (
                  <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten_cong_ty}</option>
                ))}
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="payout-hotel">Khách sạn</label>
              <select
                id="payout-hotel"
                className="mgmt-select-inline"
                style={inputSt}
                value={payoutFilter.khach_san_id}
                disabled={payoutFilter.doi_tac_id === 'all'}
                onChange={(e) => setPayoutFilter({ ...payoutFilter, khach_san_id: e.target.value })}
              >
                <option value="all">
                  {payoutFilter.doi_tac_id === 'all' ? '' : 'Tất cả khách sạn của đối tác'}
                </option>
                {payoutHotelsForPartner.map((h) => (
                  <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
                ))}
              </select>
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="payout-status">Trạng thái thanh toán</label>
              <select
                id="payout-status"
                className="mgmt-select-inline"
                style={inputSt}
                value={payoutFilter.trang_thai}
                onChange={(e) => setPayoutFilter({ ...payoutFilter, trang_thai: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="cho_thanh_toan">Chờ thanh toán</option>
                <option value="da_thanh_toan">Đã thanh toán</option>
              </select>
            </div>
            <div className="mgmt-filter-field mgmt-filter-field--action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPayoutFilter({
                    doi_tac_id: 'all',
                    khach_san_id: 'all',
                    trang_thai: 'all',
                  });
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">
                Danh sách thanh toán đối tác ({partnerPayoutSummaries.length})
              </h3>
            </div>
            {!partnerPayoutSummaries.length ? (
              <div className="empty-state">
                <p className="empty-state-text">
                  Chưa có dữ liệu thanh toán đối tác. Sau khi đối soát hoa hồng, đối tác sẽ xuất hiện trong danh sách.
                </p>
              </div>
            ) : (
              <div className="mgmt-table-scroll">
                <table className="data-table data-table-grid admin-mgmt-table">
                  <thead>
                    <tr>
                      <th>Mã đối tác</th>
                      <th className="mgmt-col-name">Tên đối tác</th>
                      <th>Tổng doanh thu</th>
                      <th>Tổng hoa hồng</th>
                      <th>Đã thanh toán</th>
                      <th>Chờ thanh toán</th>
                      <th className="table-action-cell--compact" scope="col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutPg.pagedItems.map((row) => {
                      const canConfirm = row.cho_thanh_toan > 0 && row.so_don_cho_tt > 0;
                      return (
                        <tr key={row.ma_doi_tac}>
                          <td className="mgmt-table-cell-code">#{row.ma_doi_tac}</td>
                          <td className="mgmt-col-name" style={{ fontWeight: 500 }}>{row.ten_cong_ty}</td>
                          <td>{fmt(row.tong_doanh_thu)}</td>
                          <td style={{ color: '#b36b00', fontWeight: 500 }}>{fmt(row.tong_hoa_hong)}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(row.da_thanh_toan)}</td>
                          <td style={{ color: '#b45309', fontWeight: 700 }}>{fmt(row.cho_thanh_toan)}</td>
                          <ActionCell>
                            <ActionButton
                              variant="view"
                              iconOnly
                              icon={Eye}
                              title="Xem chi tiết"
                              onClick={() => navigate(`/admin/finance/partner-payouts/${row.ma_doi_tac}`)}
                            />
                            <ActionButton
                              variant="confirm"
                              iconOnly
                              icon={Check}
                              title={canConfirm
                                ? `Thanh toán ${row.so_don_cho_tt} đơn đang chờ`
                                : 'Không có đơn chờ thanh toán'}
                              disabled={!canConfirm}
                              onClick={() => {
                                if (!canConfirm) return;
                                setPayoutFormError('');
                                setPayoutAction({
                                  type: 'confirm',
                                  id: row.ma_doi_tac,
                                  name: row.ten_cong_ty,
                                  amount: row.cho_thanh_toan,
                                  soDon: row.so_don_cho_tt,
                                });
                              }}
                            />
                          </ActionCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {payoutPg.showPagination && (
              <ListPagination
                total={partnerPayoutSummaries.length}
                currentPage={payoutPg.currentPage}
                totalPages={payoutPg.totalPages}
                rangeFrom={payoutPg.rangeFrom}
                rangeTo={payoutPg.rangeTo}
                pageNumbers={payoutPg.pageNumbers}
                onPageChange={payoutPg.setPage}
              />
            )}
          </div>
        </>
      )}

      {txModalId && (
        <TransactionDetailModal
          id={txModalId}
          onClose={() => setTxModalId(null)}
        />
      )}

      {refundModalId && (
        <RefundDetailModal
          id={refundModalId}
          onClose={() => {
            setRefundModalId(null);
            dispatch(fetchRefunds(rfFilter));
            dispatch(fetchFinanceOverview());
          }}
        />
      )}

      {commModalId && (
        <CommissionDetailModal
          commissionId={commModalId}
          onClose={() => setCommModalId(null)}
          onRequestAction={setCommAction}
        />
      )}

      <ConfirmModal
        open={!!commAction}
        variant={commAction?.type === 'hold' ? 'danger' : 'primary'}
        icon={
          commAction?.type === 'hold' ? <Pause size={20} />
            : commAction?.type === 'release' ? <Play size={20} />
              : <Check size={20} />
        }
        title={
          commAction?.type === 'hold' ? 'Xác nhận tạm giữ hoa hồng'
            : commAction?.type === 'release' ? 'Xác nhận bỏ tạm giữ'
              : 'Xác nhận đối soát hoa hồng'
        }
        intro={
          commAction?.type === 'hold'
            ? `Tạm giữ hoa hồng đơn #${commAction?.code || ''}? Đơn sẽ không được đối soát/thanh toán cho đến khi bỏ tạm giữ.`
            : commAction?.type === 'release'
              ? `Bỏ tạm giữ đơn #${commAction?.code || ''}?`
              : `Xác nhận đối soát hoa hồng đơn #${commAction?.code || ''}? Đơn sẽ chuyển sang thanh toán đối tác.`
        }
        confirmText={
          commAction?.type === 'hold' ? 'Tạm giữ'
            : commAction?.type === 'release' ? 'Bỏ tạm giữ'
              : 'Xác nhận đối soát'
        }
        loading={commActionLoading}
        onClose={() => !commActionLoading && setCommAction(null)}
        onConfirm={handleConfirmCommAction}
      />

      <ConfirmModal
        open={!!payoutAction && payoutAction.type === 'release'}
        variant="primary"
        icon={<Play size={20} />}
        title="Bỏ tạm giữ thanh toán đối tác"
        intro={`Bỏ tạm giữ các đơn của đối tác "${payoutAction?.name || ''}"? Đơn sẽ quay lại chờ thanh toán.`}
        confirmText="Bỏ tạm giữ"
        loading={payoutActionLoading}
        onClose={() => !payoutActionLoading && setPayoutAction(null)}
        onConfirm={handleConfirmPayoutAction}
      />

      <PartnerPayoutConfirmModal
        open={!!payoutAction && payoutAction.type === 'confirm'}
        partnerName={payoutAction?.name}
        amount={payoutAction?.amount}
        soDon={payoutAction?.soDon}
        loading={payoutActionLoading}
        submitError={payoutFormError}
        onClose={() => {
          if (payoutActionLoading) return;
          setPayoutAction(null);
          setPayoutFormError('');
        }}
        onConfirm={handleConfirmPayoutPayment}
      />
    </div>
  );
};

export default AdminFinancePage;