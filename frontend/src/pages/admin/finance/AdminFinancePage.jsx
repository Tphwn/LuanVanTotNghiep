 import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchFinanceOverview,
  fetchPaymentStats,
  fetchTransactions,
  fetchRefunds,
  fetchCommissions,
  fetchCommissionStats,
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
import PartnerPayoutDetailModal from './components/PartnerPayoutDetailModal';
import PartnerPayoutConfirmModal from './components/PartnerPayoutConfirmModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';

// ===== HELPERS =====
const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(v || 0);
const fmtCompact = (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact'}).format(v || 0) +'₫';
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
  cho:          { label: 'Chờ',         cls: 'badge-warning'},
  thanh_cong:   { label:'Thành công',  cls: 'badge-success'},
  that_bai:     { label:'Thất bại',    cls: 'badge-danger'},
};

const REFUND_STATUS = REFUND_TRANG_THAI;

const COMM_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'badge-warning' },
  da_thu: { label: 'Đã đối soát', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
  da_thanh_toan: { label: 'Đã thanh toán ĐT', cls: 'badge-info' },
};

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
};

const StatCard = ({ title, value, subtitle }) => (
  <div className="content-card" style={{ flex: '1 1 200px', padding: '16px 20px', marginBottom: 0 }}>
    <div style={{ fontSize: 12, color: '#5a7a72', marginBottom: 6, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e28' }}>{value}</div>
    {subtitle && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{subtitle}</div>}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    overview,
    stats,
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
  const [tab, setTab] = useState(FINANCE_TABS.includes(initialTab) ? initialTab : 'overview');

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && FINANCE_TABS.includes(urlTab) && urlTab !== tab) {
      setTab(urlTab);
    }
    if (!urlTab && tab !== 'overview') {
      setTab('overview');
    }
  }, [searchParams, tab]);

  const handleTabChange = (tabId) => {
    setTab(tabId);
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
  const [payoutModalId, setPayoutModalId] = useState(null);
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
    tu_ngay: '',
    den_ngay: '',
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
    dispatch(fetchPaymentStats());
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
  const payoutPg = useListPagination(partnerPayouts || [], 10, [partnerPayouts]);

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
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tài chính</h1>
          <p className="page-subtitle">Giao dịch, hoàn tiền, hoa hồng và thanh toán đối tác</p>
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
        <>
          {overview && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              <StatCard title="Tổng doanh thu (GMV)" value={fmt(overview.tong_doanh_thu)} subtitle="Giá trị đơn đặt phòng" />
              <StatCard title="Hoa hồng đã thu" value={fmt(overview.tong_hoa_hong)} subtitle="Lợi nhuận từ đối tác" />
              <StatCard title="Đã hoàn trả khách" value={fmt(overview.tong_hoan_tien)} />
              <StatCard title="Đơn hoàn thành" value={`${overview.so_don_thanh_cong || 0} đơn`} />
            </div>
          )}

          {stats && (
          <div className="content-card">
            <h3 className="content-card-title"style={{ marginBottom:16 }}> Doanh thu 6 tháng gần nhất</h3>
            <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:160, padding:'0 8px'}}>
              {stats.bieu_do_thang?.map((m, i) => {
                const max = Math.max(...stats.bieu_do_thang.map(x => Number(x.doanh_thu)));
                const h = max > 0 ? (Number(m.doanh_thu) / max) * 130 : 0;
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ fontSize:11, color:'#3C7363', fontWeight:500 }}>
                      {fmtCompact(m.doanh_thu)}
                    </div>
                    <div style={{
                      width:'100%', height: h || 4, borderRadius:'6px 6px 0 0',
                      background: i === stats.bieu_do_thang.length - 1 ? '#3C7363':'#8FD9C4',
                      transition:'height .3s',
                      minHeight:4,
                    }} />
                    <div style={{ fontSize:11, color:'#5a7a72'}}>{m.thang}</div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {pendingRefunds > 0 && (
            <div style={{
              marginTop:16, padding:'12px 16px', background:'#fff8e6',
              border:'1px solid #fac775', borderRadius:10, fontSize:14, color:'#854F0B',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <span> Có <strong>{pendingRefunds}</strong> yêu cầu hoàn tiền đang chờ xử lý</span>
              <button className="btn btn-outline btn-sm"onClick={() => setTab('refunds')}>
                Xử lý ngay →
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== GIAO DỊCH ===== */}
      {tab === 'transactions'&& (
        <>
          {/* Filter */}
          <div className="content-card"style={{ marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Tìm kiếm</label>
                <input style={{ ...inputSt, width:'100%'}}
                  placeholder="Mã GD, tham chiếu, mã đơn..."
                  value={txFilter.keyword}
                  onChange={e => setTxFilter({...txFilter, keyword:e.target.value})}
                  onKeyDown={e => e.key==='Enter'&& dispatch(fetchTransactions(txFilter))}
                />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Trạng thái</label>
                <select style={{ ...inputSt, width:'100%'}} value={txFilter.trang_thai}
                  onChange={e => setTxFilter({...txFilter, trang_thai:e.target.value})}>
                  <option value="all">Tất cả</option>
                  <option value="cho">Chờ</option>
                  <option value="thanh_cong">Thành công</option>
                  <option value="that_bai">Thất bại</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Phương thức</label>
                <select style={{ ...inputSt, width:'100%'}} value={txFilter.phuong_thuc}
                  onChange={e => setTxFilter({...txFilter, phuong_thuc:e.target.value})}>
                  <option value="all">Tất cả</option>
                  <option value="truc_tuyen">Trực tuyến</option>
                  <option value="tai_khach_san">Tại khách sạn</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Từ ngày</label>
                <input type="date"style={{ ...inputSt, width:'100%'}} value={txFilter.tu_ngay}
                  onChange={e => setTxFilter({...txFilter, tu_ngay:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Đến ngày</label>
                <input type="date"style={{ ...inputSt, width:'100%'}} value={txFilter.den_ngay}
                  onChange={e => setTxFilter({...txFilter, den_ngay:e.target.value})} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary"onClick={() => dispatch(fetchTransactions(txFilter))}> Tìm</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setTxFilter({trang_thai:'all', phuong_thuc:'all', tu_ngay:'', den_ngay:'', keyword:''}); dispatch(fetchTransactions()); }}>Xóa bộ lọc</button>
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
                    <th>Khách sạn / Phòng</th>
                    <th>Khách hàng</th>
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
                        <td>
                          <div className="mgmt-cell-name">{getTxHotelName(tx)}</div>
                          <div className="mgmt-cell-sub">Loại: {getTxRoomType(tx)}</div>
                        </td>
                        <td>{formatTxCustomer(tx)}</td>
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
          <div className="content-card"style={{ marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Tìm kiếm</label>
                <input
                  style={{ ...inputSt, width:'100%' }}
                  placeholder="Mã đơn hoặc tên khách hàng..."
                  value={rfFilter.keyword}
                  onChange={e => setRfFilter({ ...rfFilter, keyword: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && dispatch(fetchRefunds(rfFilter))}
                />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Trạng thái</label>
                <select style={{ ...inputSt, width:'100%'}} value={rfFilter.trang_thai}
                  onChange={e => setRfFilter({...rfFilter, trang_thai:e.target.value})}>
                  <option value="all">Tất cả</option>
                  <option value="cho_xu_ly">Chờ xử lý</option>
                  <option value="dang_xu_ly">Đang xử lý</option>
                  <option value="da_hoan">Đã hoàn</option>
                  <option value="tu_choi">Từ chối</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Từ ngày</label>
                <input type="date"style={{ ...inputSt, width:'100%'}} value={rfFilter.tu_ngay}
                  onChange={e => setRfFilter({...rfFilter, tu_ngay:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Đến ngày</label>
                <input type="date"style={{ ...inputSt, width:'100%'}} value={rfFilter.den_ngay}
                  onChange={e => setRfFilter({...rfFilter, den_ngay:e.target.value})} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => dispatch(fetchRefunds(rfFilter))}>Tìm</button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setRfFilter({ trang_thai:'all', tu_ngay:'', den_ngay:'', keyword:'' });
                dispatch(fetchRefunds());
              }}>Xóa bộ lọc</button>
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
                    <th>Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
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
                        <td>{customerName}</td>
                        <td style={{ fontWeight:500, color:'#e05c5c' }}>{fmt(r.so_tien_hoan)}</td>
                        <td style={{ whiteSpace:'nowrap' }}>{r.phuong_thuc || '—'}</td>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <StatCard
              title="Tổng hoa hồng hệ thống"
              value={fmt(commissionStats?.tong_hoa_hong_he_thong)}
              subtitle="Tiền hệ thống giữ lại"
            />
            <StatCard
              title="Doanh thu hợp lệ"
              value={fmt(commissionStats?.doanh_thu_hop_le)}
              subtitle="Tổng tiền các đơn đã tính HH"
            />
            <StatCard
              title="Số đơn tính hoa hồng"
              value={`${commissionStats?.so_don_da_tinh || 0} đơn`}
            />
            <StatCard title="Chờ đối soát" value={`${commissionStats?.cho_doi_soat || 0}`} />
            <StatCard title="Đã đối soát" value={`${commissionStats?.da_doi_soat || 0}`} />
            <StatCard title="Tạm giữ" value={`${commissionStats?.tam_giu || 0}`} />
          </div>

          <div className="content-card finance-filter-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Đối tác</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
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
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Khách sạn</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
                  value={commFilter.khach_san_id}
                  disabled={commFilter.doi_tac_id === 'all'}
                  title={commFilter.doi_tac_id === 'all' ? '' : undefined}
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
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Trạng thái đối soát</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
                  value={commFilter.trang_thai}
                  onChange={(e) => setCommFilter({ ...commFilter, trang_thai: e.target.value })}
                >
                  <option value="all">Tất cả</option>
                  <option value="chua_thu">Chờ đối soát</option>
                  <option value="da_thu">Đã đối soát</option>
                  <option value="tam_giu">Tạm giữ</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Từ ngày trả</label>
                <input
                  type="date"
                  style={{ ...inputSt, width: '100%' }}
                  value={commFilter.tu_ngay}
                  onChange={(e) => setCommFilter({ ...commFilter, tu_ngay: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Đến ngày trả</label>
                <input
                  type="date"
                  style={{ ...inputSt, width: '100%' }}
                  value={commFilter.den_ngay}
                  onChange={(e) => setCommFilter({ ...commFilter, den_ngay: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => loadCommissions(commFilter)}>
                Lọc
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const reset = {
                    doi_tac_id: 'all',
                    khach_san_id: 'all',
                    trang_thai: 'all',
                    tu_ngay: '',
                    den_ngay: '',
                  };
                  setCommFilter(reset);
                  loadCommissions(reset);
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>

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
                      <th>Khách sạn</th>
                      <th>Đối tác</th>
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
                      const canConfirm = c.trang_thai === 'chua_thu';
                      const canHold = c.trang_thai === 'chua_thu' || c.trang_thai === 'da_thu';
                      const canRelease = c.trang_thai === 'tam_giu';
                      return (
                        <tr key={c.ma_hoa_hong}>
                          <td className="mgmt-table-cell-code">#{c.dat_phong?.ma_don_hang}</td>
                          <td>{c.dat_phong?.loai_phong?.khach_san?.ten || '—'}</td>
                          <td>{c.doi_tac?.ten_cong_ty || '—'}</td>
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
                            <ActionButton
                              variant="confirm"
                              iconOnly
                              icon={Check}
                              title="Xác nhận đối soát"
                              disabled={!canConfirm}
                              onClick={() => canConfirm && setCommAction({
                                type: 'confirm',
                                id: c.ma_hoa_hong,
                                code: c.dat_phong?.ma_don_hang,
                              })}
                            />
                            {canRelease ? (
                              <ActionButton
                                variant="unlock"
                                iconOnly
                                icon={Play}
                                title="Bỏ tạm giữ"
                                onClick={() => setCommAction({
                                  type: 'release',
                                  id: c.ma_hoa_hong,
                                  code: c.dat_phong?.ma_don_hang,
                                })}
                              />
                            ) : (
                              <ActionButton
                                variant="lock"
                                iconOnly
                                icon={Pause}
                                title="Tạm giữ"
                                disabled={!canHold}
                                onClick={() => canHold && setCommAction({
                                  type: 'hold',
                                  id: c.ma_hoa_hong,
                                  code: c.dat_phong?.ma_don_hang,
                                })}
                              />
                            )}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <StatCard
              title="Tổng tiền chờ thanh toán"
              value={fmt(partnerPayoutStats?.tong_cho_thanh_toan)}
              subtitle="Sau khi trừ hoa hồng hệ thống"
            />
            <StatCard
              title="Tổng tiền đã thanh toán"
              value={fmt(partnerPayoutStats?.tong_da_thanh_toan)}
            />
            <StatCard
              title="Số đối tác chờ thanh toán"
              value={`${partnerPayoutStats?.so_doi_tac_cho || 0}`}
            />
            <StatCard
              title="Số kỳ thanh toán tạm giữ"
              value={`${partnerPayoutStats?.so_ky_tam_giu || 0}`}
            />
          </div>

          <div className="content-card finance-filter-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Đối tác</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
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
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Khách sạn</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
                  value={payoutFilter.khach_san_id}
                  disabled={payoutFilter.doi_tac_id === 'all'}
                  title={payoutFilter.doi_tac_id === 'all' ? '' : undefined}
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
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Trạng thái thanh toán</label>
                <select
                  style={{ ...inputSt, width: '100%' }}
                  value={payoutFilter.trang_thai}
                  onChange={(e) => setPayoutFilter({ ...payoutFilter, trang_thai: e.target.value })}
                >
                  <option value="all">Tất cả</option>
                  <option value="cho_thanh_toan">Chờ thanh toán</option>
                  <option value="da_thanh_toan">Đã thanh toán</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Từ ngày trả</label>
                <input
                  type="date"
                  style={{ ...inputSt, width: '100%' }}
                  value={payoutFilter.tu_ngay}
                  onChange={(e) => setPayoutFilter({ ...payoutFilter, tu_ngay: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>Đến ngày trả</label>
                <input
                  type="date"
                  style={{ ...inputSt, width: '100%' }}
                  value={payoutFilter.den_ngay}
                  onChange={(e) => setPayoutFilter({ ...payoutFilter, den_ngay: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => loadPartnerPayouts(payoutFilter)}>
                Lọc
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const reset = {
                    doi_tac_id: 'all',
                    khach_san_id: 'all',
                    trang_thai: 'all',
                    tu_ngay: '',
                    den_ngay: '',
                  };
                  setPayoutFilter(reset);
                  loadPartnerPayouts(reset);
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">
                Danh sách thanh toán đối tác ({partnerPayouts?.length || 0})
              </h3>
            </div>
            {!partnerPayouts?.length ? (
              <div className="empty-state">
                <p className="empty-state-text">
                  Chưa có đối tác cần thanh toán. Chỉ hiện đơn đã đối soát hoa hồng và chưa thanh toán / không tạm giữ.
                </p>
              </div>
            ) : (
              <div className="mgmt-table-scroll">
                <table className="data-table data-table-grid admin-mgmt-table">
                  <thead>
                    <tr>
                      <th>Mã đối tác</th>
                      <th>Tên đối tác</th>
                      <th>Số KS</th>
                      <th>Số đơn đã đối soát</th>
                      <th>Tổng doanh thu</th>
                      <th>Hoa hồng hệ thống</th>
                      <th>Số tiền cần TT</th>
                      <th>Trạng thái</th>
                      <th className="table-action-cell--compact" scope="col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutPg.pagedItems.map((row) => {
                      const st = PAYOUT_STATUS[row.trang_thai] || {
                        label: row.trang_thai,
                        cls: 'badge-default',
                      };
                      const canConfirm = row.trang_thai === 'cho_thanh_toan' && row.so_don_cho_tt > 0;
                      const canRelease = row.trang_thai === 'tam_giu' || row.so_don_tam_giu > 0;
                      return (
                        <tr key={row.ma_doi_tac}>
                          <td className="mgmt-table-cell-code">#{row.ma_doi_tac}</td>
                          <td style={{ fontWeight: 500 }}>{row.ten_cong_ty}</td>
                          <td>{row.so_khach_san}</td>
                          <td>{row.so_don_da_doi_soat}</td>
                          <td>{fmt(row.tong_doanh_thu)}</td>
                          <td style={{ color: '#b36b00', fontWeight: 500 }}>{fmt(row.tong_hoa_hong)}</td>
                          <td style={{ color: '#3C7363', fontWeight: 700 }}>{fmt(row.so_tien_can_thanh_toan)}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <ActionCell>
                            <ActionButton
                              variant="view"
                              iconOnly
                              icon={Eye}
                              title="Xem chi tiết"
                              onClick={() => setPayoutModalId(row.ma_doi_tac)}
                            />
                            <ActionButton
                              variant="confirm"
                              iconOnly
                              icon={Check}
                              title="Xác nhận thanh toán"
                              disabled={!canConfirm}
                              onClick={() => {
                                if (!canConfirm) return;
                                setPayoutFormError('');
                                setPayoutAction({
                                  type: 'confirm',
                                  id: row.ma_doi_tac,
                                  name: row.ten_cong_ty,
                                  amount: row.so_tien_can_thanh_toan,
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
                total={partnerPayouts.length}
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
        />
      )}

      {payoutModalId && (
        <PartnerPayoutDetailModal
          maDoiTac={payoutModalId}
          onClose={() => setPayoutModalId(null)}
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