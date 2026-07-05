import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchFinanceOverview,
  fetchPaymentStats,
  fetchTransactions,
  fetchRefunds,
  fetchCommissions,
  fetchCommissionPartner,
  fetchReconciliations,
  calculateReconciliation,
  updateReconciliationStatus,
  confirmCommission,
  clearMsg,
} from '../../../store/slices/adminFinanceSlice';
import { Eye, Check } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';

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

const REFUND_STATUS = {
  cho_xu_ly:  { label:'Chờ xử lý',   cls: 'badge-warning'},
  dang_xu_ly: { label:'Đang xử lý',  cls: 'badge-info'},
  da_hoan:    { label:'Đã hoàn',      cls: 'badge-success'},
  tu_choi:    { label:'Từ chối',      cls: 'badge-danger'},
};

const COMM_STATUS = {
  chua_thu: { label:'Chưa thu', cls: 'badge-warning'},
  da_thu:   { label:'Đã thu',   cls: 'badge-success'},
};

const RECONCILE_STATUS = {
  chua_doi_soat: { label: 'Chưa đối soát', cls: 'badge-warning' },
  da_doi_soat: { label: 'Chờ thanh toán', cls: 'badge-info' },
  da_thanh_toan: { label: 'Đã giải ngân', cls: 'badge-success' },
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    overview,
    stats,
    transactions,
    refunds,
    commissions,
    commByPartner,
    reconciliations,
    loading,
    reconcileLoading,
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

  const goToTransactionDetail = (id) => {
    navigate(`/admin/finance/transactions/${id}`, {
      state: { returnTo: '/admin/finance?tab=transactions' },
    });
  };

  const goToRefundDetail = (id) => {
    navigate(`/admin/finance/refunds/${id}`, {
      state: { returnTo: '/admin/finance?tab=refunds' },
    });
  };

  // Filters
  const [txFilter, setTxFilter]   = useState({ trang_thai:'all', phuong_thuc:'all', tu_ngay:'', den_ngay:'', keyword:''});
  const [rfFilter, setRfFilter]   = useState({ trang_thai:'all', tu_ngay:'', den_ngay:'', keyword:''});

  useEffect(() => {
    dispatch(fetchFinanceOverview());
    dispatch(fetchPaymentStats());
    dispatch(fetchTransactions());
    dispatch(fetchRefunds());
    dispatch(fetchCommissions());
    dispatch(fetchCommissionPartner());
    dispatch(fetchReconciliations());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error]);

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'transactions', label: 'Giao dịch' },
    { id: 'refunds', label: 'Hoàn tiền' },
    { id: 'commissions', label: 'Hoa hồng' },
    { id: 'partner', label: 'Thanh Toán Đối Tác' },
  ];

  const pendingRefunds = refunds.filter(r => r.trang_thai === 'cho_xu_ly').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tài chính</h1>
          <p className="page-subtitle">Giao dịch, hoàn tiền, hoa hồng và thanh toán đối tác</p>
        </div>
      </div>
      {(successMsg || error) && (
        <div style={{
          padding:'10px 16px', borderRadius:8, marginBottom:16, fontSize:14,
          background: successMsg ? '#e8f5f1':'#fff0f0',
          border:`1px solid ${successMsg ? '#8FD9C4':'#ffb3b3'}`,
          color: successMsg ? '#3C7363':'#e05c5c',
        }}>
          {successMsg ? ` ${successMsg}` : ` ${error}`}
        </div>
      )}

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
              <table className="data-table data-table-grid">
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
                  {transactions.map(tx => {
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
          </div>
        </>
      )}

      {/* ===== HOÀN TIỀN ===== */}
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
              <table className="data-table data-table-grid">
                <thead>
                  <tr>
                    <th>Mã hoàn</th>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th className="table-action-cell--compact" scope="col" aria-label="Thao tác"></th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => {
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
          </div>
        </>
      )}

      {/* ===== HOA HỒNG ===== */}
      {tab === 'commissions'&& (
        <>
          {/* Tổng hoa hồng theo đối tác */}
          <div className="content-card"style={{ marginBottom:16 }}>
            <div className="content-card-header">
              <h3 className="content-card-title"> Tổng hoa hồng theo đối tác</h3>
            </div>
            {commByPartner.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Chưa có dữ liệu</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đối tác</th>
                    <th>Số đơn</th>
                    <th>Tổng hoa hồng</th>
                  </tr>
                </thead>
                <tbody>
                  {commByPartner.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{r.doi_tac?.ten_cong_ty || `Đối tác #${r.ma_doi_tac}`}</td>
                      <td>{r._count?.ma_hoa_hong || 0} đơn</td>
                      <td style={{ fontWeight:500, color:'#b36b00'}}>{fmt(r._sum?.so_tien_hoa_hong)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Hoa hồng từng đơn */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Hoa hồng từng đơn ({commissions.length})</h3>
            </div>
            {commissions.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Chưa có hoa hồng</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Đối tác</th>
                    <th>Khách sạn</th>
                    <th>Doanh thu đơn</th>
                    <th>Tỷ lệ HH</th>
                    <th>Tiền HH</th>
                    <th>Ngày tính</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => {
                    const st = COMM_STATUS[c.trang_thai] || { label:c.trang_thai, cls:'badge-default'};
                    return (
                      <tr key={c.ma_hoa_hong}>
                        <td style={{ color:'#3C7363', fontWeight:500 }}>#{c.dat_phong?.ma_don_hang}</td>
                        <td>{c.doi_tac?.ten_cong_ty}</td>
                        <td>{c.dat_phong?.loai_phong?.khach_san?.ten}</td>
                        <td>{fmt(c.dat_phong?.thanh_toan_cuoi)}</td>
                        <td>{c.ty_le_hoa_hong}%</td>
                        <td style={{ fontWeight:500, color:'#b36b00'}}>{fmt(c.so_tien_hoa_hong)}</td>
                        <td style={{ fontSize:13, color:'#5a7a72'}}>{fmtDate(c.ngay_tinh)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell>
                          <ActionButton
                            variant="confirm"
                            iconOnly
                            icon={Check}
                            title="Xác nhận thu"
                            disabled={c.trang_thai !== 'chua_thu'}
                            onClick={() => dispatch(confirmCommission(c.ma_hoa_hong))}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== THANH TOÁN ĐỐI TÁC ===== */}
      {tab === 'partner' && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Thanh Toán Đối Tác</h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const maDoiTac = prompt('Nhập mã đối tác:');
                const thangNam = prompt('Nhập tháng/năm (VD: 06/2026):');
                if (maDoiTac && thangNam) {
                  dispatch(calculateReconciliation({ ma_doi_tac: maDoiTac, thang_nam: thangNam }))
                    .then((res) => {
                      if (calculateReconciliation.fulfilled.match(res)) {
                        dispatch(fetchReconciliations());
                      }
                    });
                }
              }}
            >
              Chốt sổ tháng
            </button>
          </div>
          {reconcileLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
          ) : reconciliations.length === 0 ? (
            <div className="empty-state"><p className="empty-state-text">Chưa có bản ghi thanh toán đối tác</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tháng/Năm</th>
                  <th>Đối tác</th>
                  <th>Tổng GMV</th>
                  <th>Hoa hồng</th>
                  <th>Hoàn tiền</th>
                  <th>Thực chuyển</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((item) => {
                  const st = RECONCILE_STATUS[item.trang_thai] || { label: item.trang_thai, cls: 'badge-default' };
                  return (
                    <tr key={item.ma_doi_soat}>
                      <td style={{ fontWeight: 600 }}>{item.thang_nam}</td>
                      <td>{item.doi_tac?.ten_cong_ty || '—'}</td>
                      <td>{fmt(item.tong_doanh_thu)}</td>
                      <td style={{ color: '#2e7d32' }}>- {fmt(item.tong_hoa_hong)}</td>
                      <td style={{ color: '#c62828' }}>- {fmt(item.tong_hoan_tien)}</td>
                      <td style={{ fontWeight: 700, color: '#3C7363' }}>{fmt(item.thanh_toan_doi_tac)}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        {item.trang_thai === 'chua_doi_soat' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => dispatch(updateReconciliationStatus({ id: item.ma_doi_soat, status: 'da_doi_soat' }))}
                          >
                            Xác nhận đối soát
                          </button>
                        )}
                        {item.trang_thai === 'da_doi_soat' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => dispatch(updateReconciliationStatus({ id: item.ma_doi_soat, status: 'da_thanh_toan' }))}
                          >
                            Đã chuyển tiền
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminFinancePage;