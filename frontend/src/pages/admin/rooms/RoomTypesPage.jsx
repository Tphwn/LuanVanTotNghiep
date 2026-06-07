import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_ROOMS = [
  { ma_loai_phong: 101, ten_loai: "Standard Double Room", khach_san: "Mường Thanh Luxury", suc_chua: 2, gia_mac_dinh: 850000, trang_thai: "hoat_dong" },
  { ma_loai_phong: 102, ten_loai: "Family Suite", khach_san: "Mường Thanh Luxury", suc_chua: 4, gia_mac_dinh: 1500000, trang_thai: "hoat_dong" },
  { ma_loai_phong: 103, ten_loai: "Ocean View Villa", khach_san: "Vinpearl Resort", suc_chua: 4, gia_mac_dinh: 3200000, trang_thai: "hoat_dong" },
  { ma_loai_phong: 104, ten_loai: "Dormitory 6 Beds", khach_san: "Sài Gòn Backpackers", suc_chua: 6, gia_mac_dinh: 150000, trang_thai: "tam_ngung" },
];

const ROOM_STATUS = {
  hoat_dong: { label: "Đang mở bán", cls: "badge-success" },
  tam_ngung: { label: "Tạm ngưng", cls: "badge-warning" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
};

const RoomTypesPage = () => {
  const navigate = useNavigate();

  // Các state cho bộ lọc
  const [keyword, setKeyword] = useState("");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Lấy danh sách Khách sạn duy nhất để đưa vào Dropdown
  const uniqueHotels = [...new Set(MOCK_ROOMS.map(r => r.khach_san))];

  // Logic lọc dữ liệu
  const filteredRooms = MOCK_ROOMS.filter((room) => {
    const matchHotel = hotelFilter === "all" || room.khach_san === hotelFilter;
    const matchStatus = statusFilter === "all" || room.trang_thai === statusFilter;
    const searchText = keyword.toLowerCase();
    const matchKeyword = 
      room.ten_loai.toLowerCase().includes(searchText) || 
      room.khach_san.toLowerCase().includes(searchText);

    return matchHotel && matchStatus && matchKeyword;
  });

  return (
    <div className="main-panel">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Loại phòng</h1>
          <p className="page-subtitle">Kiểm soát danh sách và tình trạng phòng của tất cả khách sạn</p>
        </div>
      </div>

      {/* ===== THANH TÌM KIẾM & BỘ LỌC ===== */}
      <div className="search-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Tìm tên phòng, tên khách sạn..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: '2 1 300px' }}
        />
        
        <select className="search-input" value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="all">🏢 Tất cả khách sạn</option>
          {uniqueHotels.map(hotel => <option key={hotel} value={hotel}>{hotel}</option>)}
        </select>

        <select className="search-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="hoat_dong">Đang mở bán</option>
          <option value="tam_ngung">Tạm ngưng</option>
          <option value="bi_khoa">Bị khóa</option>
        </select>
      </div>

      {/* ===== BẢNG DỮ LIỆU ===== */}
      <div className="content-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã loại</th>
              <th>Thuộc khách sạn</th>
              <th>Tên loại phòng</th>
              <th>Sức chứa</th>
              <th>Giá mặc định</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => {
              const st = ROOM_STATUS[room.trang_thai] || { label: room.trang_thai, cls: "badge-default" };
              return (
                <tr key={room.ma_loai_phong}>
                  <td style={{ color: "#5a7a72" }}>#{room.ma_loai_phong}</td>
                  <td style={{ fontWeight: 600, color: "#3C7363" }}>{room.khach_san}</td>
                  <td style={{ fontWeight: 500, color: "#1a2e28" }}>{room.ten_loai}</td>
                  <td>👤 {room.suc_chua} người</td>
                  <td style={{ fontWeight: 600, color: "#c0392b" }}>{room.gia_mac_dinh.toLocaleString('vi-VN')} đ</td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => navigate(`/admin/rooms/${room.ma_loai_phong}`)}
                    >
                      👁️ Xem chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredRooms.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Không tìm thấy loại phòng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomTypesPage;