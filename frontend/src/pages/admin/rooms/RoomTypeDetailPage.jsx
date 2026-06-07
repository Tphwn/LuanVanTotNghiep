import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ===== DỮ LIỆU ẢO CHI TIẾT (MOCK DATA) =====
const MOCK_ROOM_DETAIL = {
  ma_loai_phong: 101,
  ten_loai: "Standard Double Room",
  khach_san: "Mường Thanh Luxury",
  dien_tich: 35,
  suc_chua: 2,
  loai_giuong: "1 Giường đôi lớn (King size)",
  gia_mac_dinh: 850000,
  mo_ta: "Phòng tiêu chuẩn trang bị đầy đủ nội thất hiện đại, view hướng phố sầm uất. Phù hợp cho các cặp đôi hoặc doanh nhân công tác.",
  trang_thai: "hoat_dong",
  tien_nghi: ["Điều hòa nhiệt độ", "TV màn hình phẳng", "Bồn tắm đứng", "Máy sấy tóc", "Wifi tốc độ cao", "Mini bar"],
  hinh_anh: [
    "https://via.placeholder.com/400x250?text=Room+Image+1",
    "https://via.placeholder.com/400x250?text=Room+Image+2",
    "https://via.placeholder.com/400x250?text=Room+Image+3"
  ],
  ton_phong: [ // Dữ liệu Tồn phòng và Giá linh hoạt theo ngày
    { ngay: "2026-06-10", tong_phong: 10, phong_trong: 4, gia_ngay: 850000 },
    { ngay: "2026-06-11", tong_phong: 10, phong_trong: 0, gia_ngay: 850000 }, // Hết phòng
    { ngay: "2026-06-12", tong_phong: 10, phong_trong: 2, gia_ngay: 1200000 }, // Giá cuối tuần tăng lên
    { ngay: "2026-06-13", tong_phong: 10, phong_trong: 5, gia_ngay: 1200000 },
  ]
};

const RoomTypeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info, pricing, images

  useEffect(() => {
    // Giả lập gọi API lấy chi tiết
    setRoom(MOCK_ROOM_DETAIL);
  }, [id]);

  if (!room) return <div className="main-panel">Đang tải...</div>;

  return (
    <div className="main-panel">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>← Quay lại</button>
          <h1 className="page-title">{room.ten_loai}</h1>
          <p className="page-subtitle">Thuộc khách sạn: <strong>{room.khach_san}</strong></p>
        </div>
        <div>
          <span className={`badge ${room.trang_thai === 'hoat_dong' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 14, padding: '8px 16px' }}>
            {room.trang_thai === 'hoat_dong' ? '● Đang mở bán' : '● Đã khóa / Tạm ngưng'}
          </span>
        </div>
      </div>

      {/* ===== TABS NAV ===== */}
      <div style={{ display: "flex", gap: 20, borderBottom: "2px solid #d4ede6", marginBottom: 24 }}>
        {[
          { id: "info", label: "📝 Thông tin & Tiện nghi" },
          { id: "pricing", label: "💰 Bảng giá & Tồn phòng" },
          { id: "images", label: "🖼️ Hình ảnh phòng" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 15,
              borderBottom: activeTab === tab.id ? "3px solid #3C7363" : "3px solid transparent",
              color: activeTab === tab.id ? "#3C7363" : "#5a7a72", fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: THÔNG TIN & TIỆN NGHI ===== */}
      {activeTab === "info" && (
        <div className="form-grid">
          {/* Box Cấu hình cơ bản */}
          <div className="content-card">
            <h3 className="content-card-title mb-4">Cấu hình phòng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p><strong>Mã loại phòng:</strong> #{room.ma_loai_phong}</p>
              <p><strong>Diện tích:</strong> {room.dien_tich} m²</p>
              <p><strong>Loại giường:</strong> {room.loai_giuong}</p>
              <p><strong>Sức chứa tối đa:</strong> {room.suc_chua} người</p>
              <p><strong>Giá mặc định:</strong> <span style={{ color: '#c0392b', fontWeight: 'bold' }}>{room.gia_mac_dinh.toLocaleString('vi-VN')} VNĐ/đêm</span></p>
            </div>
            
            <h3 className="content-card-title mt-4 mb-2">Mô tả phòng</h3>
            <p style={{ color: "#5a7a72", lineHeight: 1.6 }}>{room.mo_ta}</p>
          </div>

          {/* Box Tiện nghi */}
          <div className="content-card">
            <h3 className="content-card-title mb-4">Tiện nghi có trong phòng</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {room.tien_nghi.map((tn, idx) => (
                <span key={idx} className="badge badge-info" style={{ padding: '6px 12px', fontSize: 13 }}>✓ {tn}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: BẢNG GIÁ & TỒN PHÒNG ===== */}
      {activeTab === "pricing" && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Tình trạng mở bán trong các ngày tới</h3>
            <p style={{ color: '#5a7a72', fontSize: 13, marginTop: 4 }}>Bảng này thể hiện số lượng phòng trống và giá bán linh hoạt do đối tác thiết lập theo ngày.</p>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày mở bán</th>
                <th>Tổng số lượng phòng</th>
                <th>Phòng trống (Available)</th>
                <th>Giá phòng bán ra</th>
                <th>Trạng thái ngày</th>
              </tr>
            </thead>
            <tbody>
              {room.ton_phong.map((tp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{tp.ngay}</td>
                  <td>{tp.tong_phong} phòng</td>
                  <td style={{ fontWeight: 'bold', color: tp.phong_trong === 0 ? '#e05c5c' : '#1a7a4a' }}>
                    {tp.phong_trong} phòng
                  </td>
                  <td style={{ fontWeight: 600, color: "#b36b00" }}>{tp.gia_ngay.toLocaleString('vi-VN')} đ</td>
                  <td>
                    {tp.phong_trong > 0 ? (
                      <span className="badge badge-success">Còn phòng</span>
                    ) : (
                      <span className="badge badge-danger">Đã bán hết</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== TAB 3: HÌNH ẢNH ===== */}
      {activeTab === "images" && (
        <div className="content-card">
           <h3 className="content-card-title mb-4">Album hình ảnh loại phòng</h3>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
             {room.hinh_anh.map((url, idx) => (
               <img 
                 key={idx} 
                 src={url} 
                 alt={`Room view ${idx}`} 
                 style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 8, border: '1px solid #d4ede6' }} 
               />
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypeDetailPage;