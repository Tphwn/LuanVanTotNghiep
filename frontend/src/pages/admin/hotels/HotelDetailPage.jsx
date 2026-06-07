import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// Import các hàm API từ adminHotelService
import adminHotelService from "../../../services/adminHotelService";
import { approveHotel, rejectHotel, requestInfoHotel, lockHotel, unlockHotel } from "../../../redux/slices/adminHotelSlice";

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const loadHotel = async () => {
    try {
      setLoading(true);
      const res = await adminHotelService.getHotelById(id); // Nhớ viết hàm này ở Service nhen
      setHotel(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotel();
  }, [id]);

  // ===== HÀM THAO TÁC (Tương tự List nhưng gọi API xong reload lại trang) =====
  const handleAction = async (actionType) => {
    if (actionType === 'approve') {
      if (window.confirm("Duyệt khách sạn này?")) await dispatch(approveHotel(id));
    } else if (actionType === 'reject') {
      const reason = window.prompt("Lý do từ chối:");
      if (reason) await dispatch(rejectHotel({ id, lyDo: reason }));
    } else if (actionType === 'request_info') {
      const note = window.prompt("Yêu cầu đối tác bổ sung gì?");
      if (note) await dispatch(requestInfoHotel({ id, ghiChu: note }));
    } else if (actionType === 'lock') {
      if (window.confirm("Khóa khách sạn vi phạm?")) await dispatch(lockHotel(id));
    } else if (actionType === 'unlock') {
      if (window.confirm("Mở khóa lại khách sạn?")) await dispatch(unlockHotel(id));
    }
    loadHotel(); // Reload lại dữ liệu mới nhất
  };

  if (loading) return <div className="main-panel">⏳ Đang tải thông tin khách sạn...</div>;
  if (!hotel) return <div className="main-panel">Không tìm thấy khách sạn!</div>;

  return (
    <div className="main-panel">
      {/* ===== HEADER & ACTIONS ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="page-title">{hotel.ten}</h1>
          <p className="page-subtitle">Quản lý chi tiết hồ sơ khách sạn</p>
        </div>
        
        {/* Thanh nút bấm chức năng theo trạng thái */}
        <div className="header-actions">
          {hotel.trang_thai === "cho_duyet" && (
            <>
              <button className="btn btn-primary" onClick={() => handleAction('approve')}>✅ Duyệt hoạt động</button>
              <button className="btn btn-outline" onClick={() => handleAction('request_info')}>✍️ Yêu cầu sửa</button>
              <button className="btn btn-danger" onClick={() => handleAction('reject')}>❌ Từ chối</button>
            </>
          )}
          {hotel.trang_thai === "hoat_dong" && (
            <button className="btn btn-danger" onClick={() => handleAction('lock')}>🔒 Khóa vi phạm</button>
          )}
          {hotel.trang_thai === "bi_khoa" && (
            <button className="btn btn-success" style={{ background: '#1a7a4a', color: 'white'}} onClick={() => handleAction('unlock')}>🔓 Mở khóa</button>
          )}
        </div>
      </div>

      {/* ===== TAB ĐIỀU HƯỚNG ===== */}
      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid #d4ede6", marginBottom: 24 }}>
        {[
          { id: "info", label: "Thông tin & Tiện nghi" },
          { id: "rooms", label: "Danh sách Loại phòng" },
          { id: "images", label: "Hình ảnh" },
          { id: "stats", label: "Thống kê & Đánh giá" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 0", background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid #3C7363" : "2px solid transparent",
              color: activeTab === tab.id ? "#3C7363" : "#5a7a72", fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== NỘI DUNG TABS ===== */}
      
      {/* 1. THÔNG TIN & TIỆN NGHI */}
      {activeTab === "info" && (
        <div className="form-grid">
          <div className="content-card">
            <h3 className="content-card-title mb-4">Thông tin cơ bản</h3>
            <p><strong>Tên KS:</strong> {hotel.ten}</p>
            <p><strong>Địa chỉ:</strong> {hotel.dia_chi}, {hotel.thanh_pho}</p>
            <p><strong>Hạng sao:</strong> {"⭐".repeat(hotel.so_sao || 0)}</p>
            <p><strong>Giờ Check-in:</strong> {hotel.gio_nhan_phong} | <strong>Check-out:</strong> {hotel.gio_tra_phong}</p>
            <p><strong>Mô tả:</strong> {hotel.mo_ta}</p>
          </div>
          
          <div className="content-card">
            <h3 className="content-card-title mb-4">Tiện nghi khách sạn</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {/* Giả định hotel.tien_nghi là mảng */}
              {hotel.tien_nghi?.map((tn, idx) => (
                <span key={idx} className="badge badge-info">{tn.ten_tien_nghi}</span>
              ))}
              {(!hotel.tien_nghi || hotel.tien_nghi.length === 0) && <p>Chưa cập nhật tiện nghi.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 2. LOẠI PHÒNG */}
      {activeTab === "rooms" && (
        <div className="content-card">
           <table className="data-table">
             <thead>
               <tr>
                 <th>Loại phòng</th>
                 <th>Diện tích</th>
                 <th>Sức chứa</th>
                 <th>Giá mặc định</th>
               </tr>
             </thead>
             <tbody>
               {hotel.loai_phong?.map(room => (
                 <tr key={room.ma_loai_phong}>
                   <td style={{ fontWeight: 500 }}>{room.ten_loai}</td>
                   <td>{room.dien_tich} m²</td>
                   <td>{room.suc_chua} người</td>
                   <td style={{ color: "#c0392b", fontWeight: 600 }}>{room.gia_mac_dinh?.toLocaleString('vi-VN')} đ</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {/* 3. HÌNH ẢNH */}
      {activeTab === "images" && (
        <div className="content-card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {hotel.hinh_anh?.map((img, idx) => (
               <img key={idx} src={img.url} alt="Hình ảnh KS" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 8, border: '1px solid #d4ede6' }} />
            ))}
            {(!hotel.hinh_anh || hotel.hinh_anh.length === 0) && <p>Đối tác chưa tải ảnh lên.</p>}
          </div>
        </div>
      )}

      {/* 4. THỐNG KÊ & ĐÁNH GIÁ */}
      {activeTab === "stats" && (
        <div className="form-grid">
          <div className="content-card">
            <h3 className="content-card-title mb-4">Thống kê đặt phòng</h3>
            <p><strong>Tổng số đơn đã đặt:</strong> {hotel.thong_ke?.tong_don || 0} đơn</p>
            <p><strong>Đơn thành công:</strong> <span style={{ color: '#1a7a4a', fontWeight: 'bold'}}>{hotel.thong_ke?.don_thanh_cong || 0}</span> đơn</p>
            <p><strong>Đơn đã hủy:</strong> <span style={{ color: '#c0392b', fontWeight: 'bold'}}>{hotel.thong_ke?.don_huy || 0}</span> đơn</p>
          </div>
          <div className="content-card">
             <h3 className="content-card-title mb-4">Điểm đánh giá</h3>
             <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b36b00' }}>
               {hotel.diem_danh_gia_trung_binh || "0.0"} / 5.0
             </div>
             <p style={{ color: '#5a7a72' }}>Dựa trên {hotel.tong_luot_danh_gia || 0} lượt đánh giá từ khách hàng.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default HotelDetailPage;