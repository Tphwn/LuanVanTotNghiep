import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPaymentStats, fetchTransactions, fetchTransactionById,
  fetchRefunds, fetchCommissions, fetchCommissionPartner,
  fetchPartnerPayments, approveRefund, rejectRefund,
  confirmCommission, clearMsg, clearDetail,
} from '../../../store/slices/adminPaymentSlice';
import { Eye, Check, X } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';

// ===== HELPERS =====
const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(v || 0);
const fmtCompact = (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact'}).format(v || 0) +'₫';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

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

const InfoRow = ({ label, value }) => (
  <div style={{ display:'flex', padding:'8px 0', borderBottom:'0.5px solid #f0f0f0', fontSize:14, gap:12 }}>
    <span style={{ width:180, color:'#5a7a72', flexShrink:0, fontSize:13 }}>{label}</span>
    <span style={{ color:'#1a2e28', fontWeight:500, flex:1 }}>{value||'—'}</span>
  </div>
);

const inputSt = {
  padding:'9px 12px', border:'1px solid #d4ede6',
  borderRadius:8, fontSize:14, outline:'none',
  fontFamily:'inherit', background:'#fff',
};

const TxDetailModal = ({ tx, onClose }) => {
  if (!tx) return null;
  const st = TX_STATUS[tx.trang_thai] || { label: tx.trang_thai, cls: 'badge-default'};
  return (
    <div className="modal-overlay"onClick={onClose}>
      <div className="modal-box"style={{ maxWidth:620 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title"> Chi tiết giao dịch #{tx.ma_thanh_toan}</h3>
          <button className="modal-close"onClick={onClose}>×</button>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <span style={{ fontSize:13, color:'#5a7a72'}}>{fmtDateTime(tx.thoi_gian)}</span>
        </div>
        <div className="form-grid">
          <div>
            <h4 style={{ fontSize:13, fontWeight:600, color:'#3C7363', marginBottom:8 }}> Thanh toán</h4>
            <InfoRow label="Mã giao dịch"value={tx.ma_giao_dich || 'N/A'} />
            <InfoRow label="Số tiền"value={fmt(tx.so_tien)} />
            <InfoRow label="Phương thức"value={tx.phuong_thuc} />
            <InfoRow label="Trạng thái"value={st.label} />
            <InfoRow label="Thời gian"value={fmtDateTime(tx.thoi_gian)} />
          </div>
          <div>
            <h4 style={{ fontSize:13, fontWeight:600, color:'#3C7363', marginBottom:8 }}> Đơn đặt phòng</h4>
            <InfoRow label="Mã đơn"value={`#${tx.dat_phong?.ma_don_hang}`} />
            <InfoRow label="Khách sạn"value={tx.dat_phong?.loai_phong?.khach_san?.ten} />
            <InfoRow label="Loại phòng"value={tx.dat_phong?.loai_phong?.ten_loai} />
            <InfoRow label="Người đặt"value={tx.dat_phong?.khach_hang?.ho_ten} />
            <InfoRow label="Nhận phòng"value={fmtDate(tx.dat_phong?.ngay_nhan_phong)} />
          </div>
        </div>
        {tx.hoan_tien && (
          <div style={{ marginTop:14, padding:12, background:'#fff8e6', borderRadius:8, border:'1px solid #fac775', fontSize:13 }}>
            <strong> Hoàn tiền:</strong> {fmt(tx.hoan_tien.so_tien_hoan)} — {REFUND_STATUS[tx.hoan_tien.trang_thai]?.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== REJECT REFUND MODAL =====
const RejectRefundModal = ({ id, onClose, onSubmit, loading }) => {
  const [lyDo, setLyDo] = useState('');
  return (
    <div className="modal-overlay"onClick={onClose}>
      <div className="modal-box"style={{ maxWidth:460 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title"> Từ chối hoàn tiền</h3>
          <button className="modal-close"onClick={onClose}>×</button>
        </div>
        <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:6 }}>
          Lý do từ chối <span style={{ color:'#e05c5c'}}>*</span>
        </label>
        <textarea rows={3} value={lyDo} onChange={e=>setLyDo(e.target.value)}
          placeholder="Nhập lý do từ chối rõ ràng..."style={{ width:'100%', padding:'9px 12px', border:'1px solid #d4ede6', borderRadius:8, fontSize:14, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box'}}
        />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
          <button className="btn btn-ghost"onClick={onClose}>Hủy</button>
          <button className="btn btn-danger"disabled={loading}
            onClick={() => { if (!lyDo.trim()) return alert('Nhập lý do'); onSubmit(id, lyDo); }}>
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const AdminPaymentsPage = () => {
  const dispatch = useDispatch();
  const {
    stats, transactions, txDetail, refunds,
    commissions, commByPartner, partnerPayments,
    loading, error, successMsg,
  } = useSelector(s => s.adminPayment || {});

  const [tab, setTab] = useState('dashboard');

  // Filters
  const [txFilter, setTxFilter]   = useState({ trang_thai:'all', tu_ngay:'', den_ngay:'', keyword:''});
  const [rfFilter, setRfFilter]   = useState({ trang_thai:'all', tu_ngay:'', den_ngay:''});

  // Modals
  const [showTxDetail, setShowTxDetail]     = useState(false);
  const [rejectModal, setRejectModal]       = useState(null);

  useEffect(() => {
    dispatch(fetchPaymentStats());
    dispatch(fetchTransactions());
    dispatch(fetchRefunds());
    dispatch(fetchCommissions());
    dispatch(fetchCommissionPartner());
    dispatch(fetchPartnerPayments());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error]);

  const tabs = [
    { id:'dashboard',   label:'Dashboard'         },
    { id:'transactions',label:'Giao dịch'         },
    { id:'refunds',     label:` Hoàn tiền${refunds.filter(r=>r.trang_thai==='cho_xu_ly').length > 0 ? ` (${refunds.filter(r=>r.trang_thai==='cho_xu_ly').length})` : ''}` },
    { id:'commissions', label:'Hoa hồng'          },
    { id:'partner',     label:'Thanh toán ĐT'     },
  ];

  const pendingRefunds = refunds.filter(r => r.trang_thai === 'cho_xu_ly').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tài chính</h1>
          <p className="page-subtitle">Thanh toán, hoàn tiền, hoa hồng và thanh toán đối tác</p>
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{
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
      {tab ==='dashboard'&& stats && (
        <>
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

          {/* Hoàn tiền chờ xử lý */}
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#5a7a72', display:'block', marginBottom:4 }}>Tìm kiếm</label>
                <input style={{ ...inputSt, width:'100%'}}
                  placeholder="Mã GD, mã đơn..."value={txFilter.keyword}
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
              <button className="btn btn-ghost"onClick={() => { setTxFilter({trang_thai:'all',tu_ngay:'',den_ngay:'',keyword:''}); dispatch(fetchTransactions()); }}>↺ Reset</button>
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
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Đơn đặt phòng</th>
                    <th>Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const st = TX_STATUS[tx.trang_thai] || { label: tx.trang_thai, cls:'badge-default'};
                    return (
                      <tr key={tx.ma_thanh_toan}>
                        <td style={{ fontWeight:500, color:'#3C7363'}}>#{tx.ma_thanh_toan}</td>
                        <td>
                          <div style={{ fontWeight:500 }}>#{tx.dat_phong?.ma_don_hang}</div>
                          <div style={{ fontSize:12, color:'#5a7a72'}}>{tx.dat_phong?.loai_phong?.khach_san?.ten}</div>
                        </td>
                        <td>{tx.dat_phong?.khach_hang?.ho_ten}</td>
                        <td style={{ fontWeight:500 }}>{fmt(tx.so_tien)}</td>
                        <td style={{ fontSize:13 }}>{tx.phuong_thuc}</td>
                        <td style={{ fontSize:13, color:'#5a7a72'}}>{fmtDateTime(tx.thoi_gian)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => { dispatch(fetchTransactionById(tx.ma_thanh_toan)); setShowTxDetail(true); }}
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
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
            <button className="btn btn-primary btn-sm"onClick={() => dispatch(fetchRefunds(rfFilter))}> Lọc</button>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Yêu cầu hoàn tiền ({refunds.length})</h3>
              {pendingRefunds > 0 && <span className="badge badge-warning">{pendingRefunds} chờ xử lý</span>}
            </div>
            {refunds.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">Chưa có yêu cầu hoàn tiền</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Đơn đặt phòng</th>
                    <th>Khách hàng</th>
                    <th>Số tiền hoàn</th>
                    <th>Lý do</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => {
                    const st = REFUND_STATUS[r.trang_thai] || { label:r.trang_thai, cls:'badge-default'};
                    const isPending = ['cho_xu_ly','dang_xu_ly'].includes(r.trang_thai);
                    return (
                      <tr key={r.ma_hoan_tien}>
                        <td style={{ color:'#5a7a72'}}>#{r.ma_hoan_tien}</td>
                        <td>
                          <div style={{ fontWeight:500 }}>#{r.dat_phong?.ma_don_hang}</div>
                          <div style={{ fontSize:12, color:'#5a7a72'}}>{r.dat_phong?.loai_phong?.khach_san?.ten}</div>
                        </td>
                        <td>
                          <div>{r.dat_phong?.khach_hang?.ho_ten}</div>
                          <div style={{ fontSize:12, color:'#5a7a72'}}>{r.dat_phong?.khach_hang?.nguoi_dung?.email}</div>
                        </td>
                        <td style={{ fontWeight:500, color:'#e05c5c'}}>{fmt(r.so_tien_hoan)}</td>
                        <td style={{ fontSize:13, color:'#5a7a72', maxWidth:160 }}>{r.ly_do || '—'}</td>
                        <td style={{ fontSize:13, color:'#5a7a72'}}>{fmtDate(r.ngay_yeu_cau)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell>
                          <ActionButton
                            variant="approve"
                            iconOnly
                            icon={Check}
                            title="Duyệt hoàn"
                            disabled={!isPending}
                            onClick={() => dispatch(approveRefund(r.ma_hoan_tien))}
                          />
                          <ActionButton
                            variant="reject"
                            iconOnly
                            icon={X}
                            title="Từ chối"
                            disabled={!isPending}
                            onClick={() => setRejectModal(r.ma_hoan_tien)}
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
      {tab ==='partner'&& (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title"> Thanh toán đối tác</h3>
          </div>
          {partnerPayments.length === 0 ? (
            <div className="empty-state"><p className="empty-state-text">Chưa có dữ liệu</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Đối tác</th>
                  <th>Số KS</th>
                  <th>Tổng doanh thu</th>
                  <th>Hoa hồng</th>
                  <th>Đã thu HH</th>
                  <th>Chưa thu HH</th>
                  <th>Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {partnerPayments.map(p => (
                  <tr key={p.ma_doi_tac}>
                    <td style={{ fontWeight:500 }}>{p.ten_cong_ty}</td>
                    <td>{p.so_ks} KS</td>
                    <td style={{ fontWeight:500 }}>{fmt(p.doanh_thu)}</td>
                    <td style={{ color:'#b36b00'}}>{fmt(p.tong_hoa_hong)}</td>
                    <td><span className="badge badge-success" style={{ fontSize:11 }}>{fmt(p.da_thu_hh)}</span></td>
                    <td><span className={`badge ${p.chua_thu_hh > 0 ?'badge-warning':'badge-default'}`} style={{ fontSize:11 }}>{fmt(p.chua_thu_hh)}</span></td>
                    <td style={{ fontWeight:700, color:'#3C7363', fontSize:15 }}>{fmt(p.thuc_nhan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {showTxDetail && (
        <TxDetailModal
          tx={txDetail}
          onClose={() => { setShowTxDetail(false); dispatch(clearDetail()); }}
        />
      )}
      {rejectModal && (
        <RejectRefundModal
          id={rejectModal}
          loading={loading}
          onClose={() => setRejectModal(null)}
          onSubmit={(id, lyDo) => {
            dispatch(rejectRefund({ id, ly_do: lyDo }));
            setRejectModal(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminPaymentsPage;