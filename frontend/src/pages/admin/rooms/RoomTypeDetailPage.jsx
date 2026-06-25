import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ManagementHeader from "../../../components/common/management/ManagementHeader";


const RoomTypeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info, pricing, images

  if (!room) return <div className="main-panel">Đang tải...</div>;

  return (
    <div className="main-panel mgmt-page">
      <ManagementHeader
        title={room.ten_loai}
        subtitle={`Thuộc khách sạn: ${room.khach_san}`}
        onBack={() => navigate(-1)}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <span className={`badge ${room.trang_thai === 'hoat_dong' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 14, padding: '8px 16px' }}>
          {room.trang_thai === 'hoat_dong' ? '● Đang mở bán' : '● Đã khóa / Tạm ngưng'}
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: "2px solid #d4ede6", marginBottom: 24 }}>
        {[
          { id: "info", label: "Thông tin & Tiện nghi" },
          { id: "pricing", label: "Bảng giá & Tồn phòng" },
          { id: "images", label: "Hình ảnh phòng" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 15,
              borderBottom: activeTab === tab.id ? "3px solid #3C7363":"3px solid transparent",
              color: activeTab === tab.id ? "#3C7363":"#5a7a72", fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info"&& (
        <div className="form-grid">
          <div className="content-card">
            <h3 className="content-card-title mb-4">Cấu hình phòng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p><strong>Mã loại phòng:</strong> #{room.ma_loai_phong}</p>
              <p><strong>Diện tích:</strong> {room.dien_tich} m²</p>
              <p><strong>Loại giường:</strong> {room.loai_giuong}</p>
              <p><strong>Sức chứa tối đa:</strong> {room.suc_chua} người</p>
              <p><strong>Giá mặc định:</strong> <span style={{ color: '#c0392b', fontWeight: 'bold'}}>{room.gia_mac_dinh.toLocaleString('vi-VN')} VNĐ/đêm</span></p>
            </div>
            
            <h3 className="content-card-title mt-4 mb-2">Mô tả phòng</h3>
            <p style={{ color: "#5a7a72", lineHeight: 1.6 }}>{room.mo_ta}</p>
          </div>

          {/* Box Tiện nghi */}
          <div className="content-card">
            <h3 className="content-card-title mb-4">Tiện nghi có trong phòng</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px"}}>
              {room.tien_nghi.map((tn, idx) => (
                <span key={idx} className="badge badge-info"style={{ padding: '6px 12px', fontSize: 13 }}>{tn}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab ==="pricing"&& (
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
                  <td style={{ fontWeight: 'bold', color: tp.phong_trong === 0 ? '#e05c5c':'#1a7a4a'}}>
                    {tp.phong_trong} phòng
                  </td>
                  <td style={{ fontWeight: 600, color: "#b36b00"}}>{tp.gia_ngay.toLocaleString('vi-VN')} đ</td>
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
      {activeTab === "images"&& (
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