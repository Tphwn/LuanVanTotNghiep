import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchHotels,
  approveHotel,
  rejectHotel,
  requestInfoHotel,
  lockHotel,
  unlockHotel,
} from "../../../redux/slices/adminHotelSlice"; // Cập nhật đường dẫn slice của bạn

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "badge-warning" },
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
  yeu_cau_sua: { label: "Yêu cầu bổ sung", cls: "badge-info" },
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels = [], loading = false } = useSelector((state) => state.adminHotels || {});

  // States cho 4 bộ lọc
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [starFilter, setStarFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  // ===== LOGIC LỌC ĐA TẦNG =====
  const filteredHotels = (hotels || []).filter((hotel) => {
    const matchStatus = statusFilter === "all" || hotel.trang_thai === statusFilter;
    const matchLocation = locationFilter === "all" || hotel.thanh_pho === locationFilter;
    const matchStar = starFilter === "all" || hotel.so_sao === Number(starFilter);
    
    const searchText = keyword.toLowerCase();
    const matchKeyword =
      hotel.ten?.toLowerCase().includes(searchText) ||
      hotel.doi_tac?.ten_cong_ty?.toLowerCase().includes(searchText) ||
      hotel.dia_chi?.toLowerCase().includes(searchText);

    return matchStatus && matchLocation && matchStar && matchKeyword;
  });

  // Lấy danh sách thành phố duy nhất để đưa vào Dropdown lọc
  const uniqueLocations = [...new Set((hotels || []).map(h => h.thanh_pho).filter(Boolean))];

  // ===== CÁC HÀM THAO TÁC =====
  const handleApprove = (hotel) => {
    if (window.confirm(`Duyệt cho khách sạn "${hotel.ten}" hoạt động trên sàn?`)) {
      dispatch(approveHotel(hotel.ma_khach_san));
    }
  };

  const handleReject = (hotel) => {
    const reason = window.prompt(`Nhập lý do từ chối khách sạn "${hotel.ten}":`);
    if (reason) dispatch(rejectHotel({ id: hotel.ma_khach_san, lyDo: reason }));
  };

  const handleRequestInfo = (hotel) => {
    const note = window.prompt(`Nhập thông tin yêu cầu đối tác bổ sung/sửa đổi:`);
    if (note) dispatch(requestInfoHotel({ id: hotel.ma_khach_san, ghiChu: note }));
  };

  const handleLockToggle = (hotel) => {
    if (hotel.trang_thai === "hoat_dong") {
      if (window.confirm(`Tạm khóa khách sạn "${hotel.ten}" do vi phạm?`)) {
        dispatch(lockHotel(hotel.ma_khach_san));
      }
    } else {
      if (window.confirm(`Mở khóa khách sạn "${hotel.ten}" (Đã khắc phục vi phạm)?`)) {
        dispatch(unlockHotel(hotel.ma_khach_san));
      }
    }
  };

  return (
    <div className="main-panel">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Khách sạn</h1>
          <p className="page-subtitle">Duyệt, kiểm tra và quản lý các cơ sở lưu trú</p>
        </div>
      </div>

      {/* ===== THANH TÌM KIẾM & BỘ LỌC TỔNG HỢP ===== */}
      <div className="search-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Tìm tên KS, đối tác, địa chỉ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: '2 1 300px' }}
        />
        
        <select className="search-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="cho_duyet">Chờ duyệt</option>
          <option value="hoat_dong">Đang hoạt động</option>
          <option value="yeu_cau_sua">Yêu cầu bổ sung</option>
          <option value="tu_choi">Từ chối</option>
          <option value="bi_khoa">Bị khóa</option>
        </select>

        <select className="search-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="all">Tất cả địa điểm</option>
          {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>

        <select className="search-input" value={starFilter} onChange={(e) => setStarFilter(e.target.value)} style={{ flex: 1 }}>
          <option value="all">Tất cả hạng sao</option>
          {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>{star} Sao</option>)}
        </select>
      </div>

      {/* ===== BẢNG DỮ LIỆU ===== */}
      <div className="content-card">
        {loading ? <p>Đang tải dữ liệu...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã KS</th>
                <th>Khách sạn</th>
                <th>Khu vực</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.map((hotel) => {
                const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "badge-default" };
                return (
                  <tr key={hotel.ma_khach_san}>
                    <td>#{hotel.ma_khach_san}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1a2e28" }}>{hotel.ten}</div>
                      <div style={{ fontSize: 12, color: "#5a7a72" }}>Chủ: {hotel.doi_tac?.ten_cong_ty}</div>
                    </td>
                    <td>{hotel.thanh_pho}</td>
                    <td style={{ color: "#b36b00" }}>{hotel.so_sao ? "⭐".repeat(hotel.so_sao) : "Chưa đánh giá"}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ textAlign: "center" }}>
                      {/* Nút xem chi tiết luôn hiển thị */}
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/hotels/${hotel.ma_khach_san}`)} style={{ marginRight: 6 }}>
                        👁️ Xem
                      </button>

                      {/* Các nút hiện theo trạng thái */}
                      {hotel.trang_thai === "cho_duyet" && (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(hotel)}>Duyệt</button>
                          <button className="btn btn-info btn-sm" style={{ background: '#17a2b8', color: '#fff', border: 'none'}} onClick={() => handleRequestInfo(hotel)}>Yêu cầu sửa</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(hotel)}>Từ chối</button>
                        </div>
                      )}

                      {hotel.trang_thai === "hoat_dong" && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleLockToggle(hotel)}>Khóa</button>
                      )}

                      {hotel.trang_thai === "bi_khoa" && (
                        <button className="btn btn-success btn-sm" style={{ background: '#1a7a4a', color: '#fff', border: 'none'}} onClick={() => handleLockToggle(hotel)}>Mở khóa</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HotelsPage;