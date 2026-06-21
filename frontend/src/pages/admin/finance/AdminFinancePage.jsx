import { useState, useEffect } from 'react';
import api from '../../../services/api';

const formatCurrency = (amount) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(amount || 0);

const formatDate = (dateString) => 
  dateString ? new Date(dateString).toLocaleDateString('vi-VN') : '—';

const StatCard = ({ title, value, color, subtitle }) => (
  <div style={{ 
    background: '#fff', padding: '20px', borderRadius: '12px', 
    borderLeft: `5px solid ${color}`, flex: '1 1 220px', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
    <div style={{ color:'#5a7a72', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a2e28'}}>{value}</div>
    {subtitle && <div style={{ fontSize:'11px', color: '#888', marginTop: '4px'}}>{subtitle}</div>}
  </div>
);

const ConfigModal = ({ onClose, onSave }) => {
  const [type, setType] = useState('he_thong'); 
  const [targetId, setTargetId] = useState('');
  const [rate, setRate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rate || isNaN(rate)) return alert('Vui lòng nhập tỷ lệ phần trăm hợp lệ');
    onSave({ type, targetId, rate: parseFloat(rate) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'}}>
        <h3 style={{ color:'#3C7363', marginTop: 0, marginBottom: '16px'}}> Cấu hình Tỷ lệ Hoa hồng</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'12px'}}>
            <label style={{ display:'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>Áp dụng cho</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
              <option value="he_thong">Mặc định toàn hệ thống</option>
              <option value="doi_tac">Theo đối tác liên kết</option>
              <option value="khach_san">Theo từng khách sạn</option>
            </select>
          </div>

          {type !=='he_thong'&& (
            <div style={{ marginBottom:'12px'}}>
              <label style={{ display:'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>Nhập Mã (ID) Đối tượng</label>
              <input type="number"required value={targetId} onChange={e => setTargetId(e.target.value)} placeholder="Ví dụ: 4"style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'}} />
            </div>
          )}

          <div style={{ marginBottom:'20px'}}>
            <label style={{ display:'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>Tỷ lệ hoa hồng (%)</label>
            <input type="number"required min="0"max="100"step="0.1"value={rate} onChange={e => setRate(e.target.value)} placeholder="Ví dụ: 12.5"style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'}} />
          </div>

          <div style={{ display:'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button type="button"onClick={onClose} style={{ padding:'8px 16px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Hủy</button>
            <button type="submit"style={{ padding:'8px 16px', background: '#3C7363', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Lưu cấu hình</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Modal Chi tiết Yêu cầu Hoàn tiền & Thao tác duyệt
const RefundDetailModal = ({ item, onClose, onAction }) => {
  const [note, setNote] = useState('');
  if (!item) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '550px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'}}>
        <h3 style={{ color:'#3C7363', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px'}}> Chi tiết Yêu cầu Hoàn tiền</h3>
        
        <div style={{ fontSize:'14px', lineHeight: '1.6', margin: '15px 0'}}>
          <p><strong>Mã Đơn hàng:</strong> #{item.dat_phong?.ma_don_hang}</p>
          <p><strong>Thông tin Khách:</strong> {item.dat_phong?.khach_hang?.ho_ten ||'Khách vãng lai'} - {item.dat_phong?.sdt_nguoi_nhan}</p>
          <p><strong>Khách sạn:</strong> {item.dat_phong?.loai_phong?.khach_san?.ten}</p>
          <p><strong>Số tiền hoàn trả:</strong> <span style={{ color: '#d63031', fontWeight: 'bold'}}>{formatCurrency(item.so_tien_hoan)}</span></p>
          <p><strong>Ngày yêu cầu:</strong> {formatDate(item.ngay_yeu_cau)}</p>
          <p><strong>Lý do hoàn tiền:</strong> {item.ly_do ||'Không có lý do cụ thể'}</p>
          <p><strong>Minh chứng kèm theo:</strong> {item.minh_chung ? <a href={item.minh_chung} target="_blank"rel="noreferrer">Xem ảnh/tài liệu minh chứng</a> : 'Không có minh chứng'}</p>
        </div>

        {item.trang_thai === 'cho_xu_ly'&& (
          <div style={{ background:'#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '16px'}}>
            <label style={{ display:'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px'}}>Ghi chú xử lý hệ thống (Nếu có)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập phản hồi hoặc lý do từ chối gửi đến đối tác/khách hàng..."style={{ width:'100%', height: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'}} />
          </div>
        )}

        <div style={{ display:'flex', gap: '10px', justifyContent: 'flex-end'}}>
          <button onClick={onClose} style={{ padding:'8px 16px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Đóng</button>
          {item.trang_thai ==='cho_xu_ly'&& (
            <>
              <button onClick={() => onAction(item.ma_hoan_tien,'tu_choi', note)} style={{ padding: '8px 16px', background: '#d63031', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Từ chối hoàn</button>
              <button onClick={() => onAction(item.ma_hoan_tien,'da_hoan', note)} style={{ padding: '8px 16px', background: '#00b894', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Duyệt hoàn tiền</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== MAIN ADMIM FINANCE COMPONENT =====
const AdminFinancePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState({});
  const [commissions, setCommissions] = useState({ list: [], stats: {} });
  const [refunds, setRefunds] = useState({ list: [], stats: {} });
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // States quản lý hiển thị Modal
  const [showConfig, setShowConfig] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  // States bộ lọc cho danh sách Hoa hồng
  const [commFilter, setCommFilter] = useState({ hotel: '', partner: '', month: '', status: ''});

  // 1. TẢI DỮ LIỆU ĐỘNG THEO TAB QUA EFFECT
  useEffect(() => {
    let isMounted = true;
    const loadFinanceData = async () => {
      setLoading(true);
      try {
        if (activeTab ==='overview') {
          const res = await api.get('/admin/finance/overview');
          if (isMounted) setOverview(res.data.data || {});
        } else if (activeTab === 'commission') {
          const res = await api.get('/admin/finance/commissions');
          if (isMounted) setCommissions(res.data.data || { list: [], stats: {} });
        } else if (activeTab === 'refund') {
          // Gắn API quản lý hoàn tiền (Giả lập endpoint hoặc dùng api thật)
          const res = await api.get('/admin/finance/refunds').catch(() => ({ data: { data: { list: [], stats: { tong_hoan: 0, tong_yeu_cau: 0, dang_cho: 0 } } } }));
          if (isMounted) setRefunds(res.data.data);
        } else if (activeTab === 'reconcile') {
          const res = await api.get('/admin/finance/reconciliations');
          if (isMounted) setReconciliations(res.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu tài chính:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    async function loadData() { await loadFinanceData(); }

    return () => { isMounted = false; };
  }, [activeTab, refreshKey]);

 const handleSaveConfig = async (configData) => {
    try {
      await api.post('/admin/finance/config', configData);
      alert('Đã cập nhật cấu hình tỷ lệ hoa hồng mới thành công!');
      setShowConfig(false);
      setRefreshKey(p => p + 1);
    } catch (err) {
      console.error(err); // <-- Thêm dòng này
      alert('Lỗi cập nhật cấu hình hệ thống!');
    }
  };

  // 3. XỬ LÝ SỰ KIỆN: DUYỆT / TỪ CHỐI HOÀN TIỀN
  const handleRefundAction = async (id, status, adminNote) => {
    try {
      await api.patch(`/admin/finance/refunds/${id}`, { status, note: adminNote });
      alert(status === 'da_hoan'?'Đã phê duyệt hoàn tiền khách hàng!':'Đã từ chối đơn yêu cầu hoàn tiền!');
      setSelectedRefund(null);
      setRefreshKey(p => p + 1);
    } catch (err) {
      console.error(err); // <-- Thêm dòng này
      alert('Lỗi cập nhật trạng thái xử lý hoàn tiền!');
    }
  };

  // 4. XỬ LÝ SỰ KIỆN: ĐỐI SOÁT CHỐT SỔ THÁNG
  const handleCalculateReconcile = async () => {
    const maDoiTac = prompt("Nhập Mã (ID) Đối Tác cần tính đối soát:");
    const thangNam = prompt("Nhập Tháng/Năm thực hiện đối soát (VD: 05/2026):");
    if (maDoiTac && thangNam) {
      try {
        await api.post('/admin/finance/reconciliations/calculate', { ma_doi_tac: maDoiTac, thang_nam: thangNam });
        alert(`Đã hoàn tất tính toán đối soát tháng ${thangNam} cho đối tác #${maDoiTac}!`);
        setRefreshKey(p => p + 1);
      } catch (err) {
        console.error(err); // <-- Thêm dòng này
        alert("Lỗi thực thi đối soát dòng tiền!");
      }
    }
  };

  // 5. XỬ LÝ SỰ KIỆN: CẬP NHẬT TRẠNG THÁI ĐỐI SOÁT (Đã đối soát / Đã thanh toán)
  const handleUpdateReconcileStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/finance/reconciliations/${id}`, { status: newStatus });
      alert('Cập nhật trạng thái chứng từ đối soát thành công!');
      setRefreshKey(p => p + 1);
    } catch (err) {
      console.error(err); // <-- Thêm dòng này
      alert('Không thể cập nhật trạng thái thanh toán!');
    }
  };
  // Logic lọc danh sách hoa hồng phía Client nếu cần thiết
  const filteredCommissions = commissions.list?.filter(item => {
    const hotelName = item.dat_phong?.loai_phong?.khach_san?.ten?.toLowerCase() || '';
    const partnerName = item.doi_tac?.ten_cong_ty?.toLowerCase() || '';
    const matchesHotel = !commFilter.hotel || hotelName.includes(commFilter.hotel.toLowerCase());
    const matchesPartner = !commFilter.partner || partnerName.includes(commFilter.partner.toLowerCase());
    const matchesStatus = !commFilter.status || item.trang_thai === commFilter.status;
    return matchesHotel && matchesPartner && matchesStatus;
  }) || [];

  return (
    <div className="main-panel"style={{ padding: '20px'}}>
      <h1 style={{ fontSize:'26px', fontWeight: 'bold', color: '#1a2e28', marginBottom: '20px'}}>Quản Lý Tài Chính</h1>

      {/* THANH ĐIỀU HƯỚNG TAB CHỨC NĂNG */}
      <div style={{ display:'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e8f5f1', paddingBottom: '10px'}}>
        {[
          { id:'overview', label: 'Thống kê sàn' },
          { id: 'commission', label: 'Quản lý Hoa hồng' },
          { id: 'refund', label: 'Quản lý Hoàn tiền' },
          { id: 'reconcile', label: 'Đối soát Đối tác' }
        ].map(t => (
          <button 
            key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '10px 18px', border: 'none', background: activeTab === t.id ? '#3C7363':'transparent', color: activeTab === t.id ? '#fff':'#5a7a72', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign:'center', color: '#5a7a72', fontSize: '15px'}}> Đang đồng bộ hóa dữ liệu tài chính...</p>}

      {/* ================= TAB 1: TỔNG QUAN HỆ THỐNG ================= */}
      {!loading && activeTab ==='overview'&& (
        <div style={{ display:'flex', flexWrap: 'wrap', gap: '20px'}}>
          <StatCard title="Tổng Doanh thu toàn sàn (GMV)"value={formatCurrency(overview.tong_doanh_thu)} color="#0984e3"subtitle="Giá trị tổng tất cả đơn đặt phòng"/>
          <StatCard title="Tổng hoa hồng đã thu"value={formatCurrency(overview.tong_hoa_hong)} color="#00b894"subtitle="Lợi nhuận gộp từ đối tác"/>
          <StatCard title="Tổng tiền đã hoàn trả"value={formatCurrency(overview.tong_hoan_tien)} color="#d63031"subtitle="Dòng tiền hoàn lại cho khách hàng"/>
          <StatCard title="Doanh thu thực nhận hệ thống"value={formatCurrency(overview.doanh_thu_thuc_nhan)} color="#6c5ce7"subtitle="Thực nhận sàn OTA sau đối lưu"/>
          <StatCard title="Số đơn thành công"value={`${overview.so_don_thanh_cong || 0} đơn`} color="#fdcb6e"/>
          <StatCard title="Số đơn đã hoàn tiền"value={`${overview.so_don_hoan_tien || 0} đơn`} color="#e17055"/>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ HOA HỒNG ================= */}
      {!loading && activeTab ==='commission'&& (
        <div>
          <div style={{ display:'flex', gap: '20px', marginBottom: '20px'}}>
            <StatCard title="Hoa hồng Hôm nay"value={formatCurrency(commissions.stats?.hom_nay)} color="#00b894"/>
            <StatCard title="Hoa hồng Tháng này"value={formatCurrency(commissions.stats?.thang_nay)} color="#0984e3"/>
            <StatCard title="Hoa hồng Năm nay"value={formatCurrency(commissions.stats?.nam_nay)} color="#6c5ce7"/>
          </div>

          <div style={{ background:'#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
            <div style={{ display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h4 style={{ color:'#3C7363', margin: 0, fontSize: '16px'}}>Lịch sử & Bộ lọc phân tách Hoa hồng</h4>
              <button onClick={() => setShowConfig(true)} style={{ background:'#3C7363', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                 Cấu hình % Hoa hồng phân cấp
              </button>
            </div>

            {/* Bộ lọc nghiệp vụ hoa hồng */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
              <input type="text"placeholder="Tìm theo khách sạn..."value={commFilter.hotel} onChange={e => setCommFilter({...commFilter, hotel: e.target.value})} style={{ padding:'8px', borderRadius: '6px', border: '1px solid #d4ede6'}} />
              <input type="text"placeholder="Tìm theo đối tác..."value={commFilter.partner} onChange={e => setCommFilter({...commFilter, partner: e.target.value})} style={{ padding:'8px', borderRadius: '6px', border: '1px solid #d4ede6'}} />
              <select value={commFilter.status} onChange={e => setCommFilter({...commFilter, status: e.target.value})} style={{ padding:'8px', borderRadius: '6px', border: '1px solid #d4ede6'}}>
                <option value="">Tất cả trạng thái</option>
                <option value="da_thu">Đã thu</option>
                <option value="chua_thu">Chờ thu</option>
              </select>
            </div>

            <table className="table"style={{ width:'100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{ background:'#f8fdfb', color: '#5a7a72', borderBottom: '2px solid #e8f5f1'}}>
                  <th style={{ padding:'12px'}}>Mã Đơn</th>
                  <th style={{ padding:'12px'}}>Khách sạn</th>
                  <th style={{ padding:'12px'}}>Đối tác quản lý</th>
                  <th style={{ padding:'12px'}}>Tỷ lệ % áp dụng</th>
                  <th style={{ padding:'12px'}}>Số tiền trích thu</th>
                  <th style={{ padding:'12px'}}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map(item => (
                  <tr key={item.ma_hoa_hong} style={{ borderBottom:'1px solid #eee'}}>
                    <td style={{ padding:'12px'}}>#{item.dat_phong?.ma_don_hang}</td>
                    <td style={{ padding:'12px'}}>{item.dat_phong?.loai_phong?.khach_san?.ten}</td>
                    <td style={{ padding:'12px'}}>{item.doi_tac?.ten_cong_ty ||'N/A'}</td>
                    <td style={{ padding: '12px'}}>{item.ty_le_hoa_hong}%</td>
                    <td style={{ padding:'12px', color: '#00b894', fontWeight: 'bold'}}>{formatCurrency(item.so_tien_hoa_hong)}</td>
                    <td style={{ padding:'12px'}}>{item.trang_thai ==='da_thu'?' Đã kết toán':' Chờ thu hộ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUẢN LÝ HOÀN TIỀN ================= */}
      {!loading && activeTab === 'refund'&& (
        <div>
          <div style={{ display:'flex', gap: '20px', marginBottom: '20px'}}>
            <StatCard title="Tổng số tiền đã hoàn"value={formatCurrency(refunds.stats?.tong_hoan)} color="#d63031"/>
            <StatCard title="Tổng số yêu cầu gửi lên"value={`${refunds.stats?.tong_yeu_cau || 0} hồ sơ`} color="#0984e3"/>
            <StatCard title="Yêu cầu đang chờ duyệt"value={`${refunds.stats?.dang_cho || 0} yêu cầu`} color="#f57c00"/>
          </div>

          <div style={{ background:'#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
            <h4 style={{ color:'#3C7363', marginBottom: '15px', fontSize: '16px'}}>Danh sách hồ sơ yêu cầu Hoàn tiền</h4>
            <table className="table"style={{ width:'100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{ background:'#f8fdfb', borderBottom: '2px solid #e8f5f1'}}>
                  <th style={{ padding:'12px'}}>Mã Đơn</th>
                  <th style={{ padding:'12px'}}>Khách hàng</th>
                  <th style={{ padding:'12px'}}>Số tiền hoàn</th>
                  <th style={{ padding:'12px'}}>Ngày yêu cầu</th>
                  <th style={{ padding:'12px'}}>Trạng thái xử lý</th>
                  <th style={{ padding:'12px'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {(refunds.list || []).map(item => (
                  <tr key={item.ma_hoan_tien} style={{ borderBottom:'1px solid #eee'}}>
                    <td style={{ padding:'12px'}}>#{item.dat_phong?.ma_don_hang}</td>
                    <td style={{ padding:'12px'}}>{item.dat_phong?.khach_hang?.ho_ten}</td>
                    <td style={{ padding:'12px', fontWeight: 'bold'}}>{formatCurrency(item.so_tien_hoan)}</td>
                    <td style={{ padding:'12px'}}>{formatDate(item.ngay_yeu_cau)}</td>
                    <td style={{ padding:'12px'}}>
                      <span style={{ 
                        padding:'4px 8px', borderRadius: '4px', fontSize: '12px', 
                        background: item.trang_thai === 'da_hoan'?'#e8f5e9': item.trang_thai ==='tu_choi'?'#ffebee':'#fff3e0',
                        color: item.trang_thai === 'da_hoan'?'#2e7d32': item.trang_thai ==='tu_choi'?'#c62828':'#f57c00'}}>
                        {item.trang_thai ==='da_hoan'?'Đã hoàn tiền': item.trang_thai ==='tu_choi'?'Từ chối':'Chờ xử lý'}
                      </span>
                    </td>
                    <td style={{ padding: '12px'}}>
                      <button onClick={() => setSelectedRefund(item)} style={{ background:'#e8f5f1', color: '#3C7363', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                        {item.trang_thai === 'cho_xu_ly'?' Xử lý đơn':' Xem chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ĐỐI SOÁT ĐỐI TÁC ================= */}
      {!loading && activeTab === 'reconcile'&& (
        <div style={{ background:'#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{ display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h4 style={{ color:'#3C7363', margin: 0, fontSize: '16px'}}>Chứng từ chốt sổ dòng tiền (Lịch sử các tháng)</h4>
            <button onClick={handleCalculateReconcile} style={{ background:'#3C7363', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
               Thực thi chốt sổ & kết toán tháng
            </button>
          </div>

          <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{ background:'#f8fdfb', borderBottom: '2px solid #e8f5f1'}}>
                <th style={{ padding:'12px'}}>Tháng/Năm</th>
                <th style={{ padding:'12px'}}>Đối tác liên kết</th>
                <th style={{ padding:'12px'}}>Tổng GMV phòng đặt</th>
                <th style={{ padding:'12px'}}>Hoa hồng trích giữ</th>
                <th style={{ padding:'12px'}}>Khấu trừ Hoàn tiền</th>
                <th style={{ padding:'12px', color: '#b71c1c'}}>Thực chuyển cho Partner</th>
                <th style={{ padding:'12px'}}>Trạng thái ví</th>
                <th style={{ padding:'12px'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map(item => (
                <tr key={item.ma_doi_soat} style={{ borderBottom:'1px solid #eee'}}>
                  <td style={{ padding:'12px', fontWeight: 'bold'}}>{item.thang_nam}</td>
                  <td style={{ padding:'12px'}}>{item.doi_tac?.ten_cong_ty}</td>
                  <td style={{ padding:'12px'}}>{formatCurrency(item.tong_doanh_thu)}</td>
                  <td style={{ padding:'12px', color: '#2e7d32'}}>- {formatCurrency(item.tong_hoa_hong)}</td>
                  <td style={{ padding:'12px', color: '#c62828'}}>- {formatCurrency(item.tong_hoan_tien)}</td>
                  <td style={{ padding:'12px', fontWeight: 'bold', color: '#d63031', fontSize: '15px'}}>{formatCurrency(item.thanh_toan_doi_tac)}</td>
                  <td style={{ padding:'12px'}}>
                    <span style={{ 
                      padding:'4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                      background: item.trang_thai === 'da_thanh_toan'?'#e8f5e9': item.trang_thai ==='da_doi_soat'?'#e3f2fd':'#fff3e0',
                      color: item.trang_thai === 'da_thanh_toan'?'#2e7d32': item.trang_thai ==='da_doi_soat'?'#1565c0':'#f57c00'}}>
                      {item.trang_thai ==='da_thanh_toan'?'Đã giải ngân': item.trang_thai ==='da_doi_soat'?'Chờ thanh toán':'Chưa đối soát'}
                    </span>
                  </td>
                  <td style={{ padding: '12px'}}>
                    <div style={{ display:'flex', gap: '6px'}}>
                      {item.trang_thai ==='chua_doi_soat'&& (
                        <button onClick={() => handleUpdateReconcileStatus(item.ma_doi_soat,'da_doi_soat')} style={{ background: '#3C7363', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>Xác nhận đối soát</button>
                      )}
                      {item.trang_thai ==='da_doi_soat'&& (
                        <button onClick={() => handleUpdateReconcileStatus(item.ma_doi_soat,'da_thanh_toan')} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>Đánh dấu đã chuyển tiền</button>
                      )}
                      <span style={{ fontSize:'12px', color: '#999'}}>{item.trang_thai ==='da_thanh_toan'&&' Hoàn tất'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RENDER DYNAMIC MODALS THEO TRẠNG THÁI */}
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} onSave={handleSaveConfig} />}
      {selectedRefund && <RefundDetailModal item={selectedRefund} onClose={() => setSelectedRefund(null)} onAction={handleRefundAction} />}
    </div>
  );
};

export default AdminFinancePage;