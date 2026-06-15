import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchHotels,
  approveHotel,
  rejectHotel,
  requestInfoHotel,
  lockHotel,
  unlockHotel,
} from "../../../redux/slices/adminHotelSlice";
import { resolveUploadUrl } from "../../../utils/media";

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "badge-warning" },
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "badge-info" },
  da_duyet: { label: "Đã duyệt", cls: "badge-info" },
};

const getMainImage = (hotel) => {
  const imgs = hotel?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh) || imgs[0];
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels = [], loading = false } = useSelector((state) => state.adminHotels || {});

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [starFilter, setStarFilter] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  const locations = useMemo(() => {
    const set = new Set((hotels || []).map((h) => h.dia_diem?.ten_dia_diem).filter(Boolean));
    return [...set].sort();
  }, [hotels]);

  const filteredHotels = useMemo(() => (hotels || []).filter((hotel) => {
    const matchStatus = statusFilter === "all" || hotel.trang_thai === statusFilter;
    const loc = hotel.dia_diem?.ten_dia_diem;
    const matchLocation = locationFilter === "all" || loc === locationFilter;
    const matchStar = starFilter === "all" || hotel.so_sao === Number(starFilter);
    const text = debouncedKeyword.toLowerCase().trim();
    if (!text) return matchStatus && matchLocation && matchStar;
    const matchKeyword =
      hotel.ten?.toLowerCase().includes(text)
      || hotel.doi_tac?.ten_cong_ty?.toLowerCase().includes(text)
      || hotel.dia_chi?.toLowerCase().includes(text)
      || loc?.toLowerCase().includes(text);
    return matchStatus && matchLocation && matchStar && matchKeyword;
  }), [hotels, statusFilter, locationFilter, starFilter, debouncedKeyword]);

  const stats = useMemo(() => ({
    total: hotels.length,
    choDuyet: hotels.filter((h) => h.trang_thai === "cho_duyet").length,
    hoatDong: hotels.filter((h) => h.trang_thai === "hoat_dong").length,
    biKhoa: hotels.filter((h) => h.trang_thai === "bi_khoa").length,
  }), [hotels]);

  const hasActiveFilter = statusFilter !== "all" || locationFilter !== "all" || starFilter !== "all" || keyword;

  const handleApprove = (hotel, e) => {
    e?.stopPropagation();
    if (window.confirm(`Duyệt khách sạn "${hotel.ten}" hoạt động trên sàn?`)) {
      dispatch(approveHotel(hotel.ma_khach_san));
    }
  };

  const handleReject = (hotel, e) => {
    e?.stopPropagation();
    const reason = window.prompt(`Nhập lý do từ chối "${hotel.ten}":`);
    if (reason?.trim()) dispatch(rejectHotel({ id: hotel.ma_khach_san, lyDo: reason.trim() }));
  };

  const handleRequestInfo = (hotel, e) => {
    e?.stopPropagation();
    const note = window.prompt(`Yêu cầu đối tác bổ sung/sửa đổi thông tin "${hotel.ten}":`);
    if (note?.trim()) dispatch(requestInfoHotel({ id: hotel.ma_khach_san, ghiChu: note.trim() }));
  };

  const handleLockToggle = (hotel, e) => {
    e?.stopPropagation();
    if (hotel.trang_thai === "hoat_dong") {
      if (window.confirm(`Khóa khách sạn "${hotel.ten}"?`)) dispatch(lockHotel(hotel.ma_khach_san));
    } else if (hotel.trang_thai === "bi_khoa") {
      if (window.confirm(`Mở khóa khách sạn "${hotel.ten}"?`)) dispatch(unlockHotel(hotel.ma_khach_san));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý khách sạn</h1>
          <p className="page-subtitle">Duyệt, kiểm tra và quản lý các cơ sở lưu trú trên hệ thống</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { label: "Tổng khách sạn", value: stats.total, color: "#3C7363", icon: "🏨" },
          { label: "Chờ duyệt", value: stats.choDuyet, color: "#b36b00", icon: "⏳" },
          { label: "Đang hoạt động", value: stats.hoatDong, color: "#52c41a", icon: "✅" },
          { label: "Bị khóa", value: stats.biKhoa, color: "#e05c5c", icon: "🔒" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="stat-card-label">{s.label}</div>
              <span>{s.icon}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="content-card" style={{ marginBottom: 16, padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "end" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Tìm kiếm</label>
            <input
              type="text"
              className="search-input"
              style={{ width: "100%" }}
              placeholder="Tên KS, đối tác, địa chỉ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Trạng thái</label>
            <select className="search-input" style={{ width: "100%" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="cho_duyet">Chờ duyệt</option>
              <option value="hoat_dong">Hoạt động</option>
              <option value="yeu_cau_sua">Yêu cầu sửa</option>
              <option value="tu_choi">Từ chối</option>
              <option value="bi_khoa">Bị khóa</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Địa điểm</label>
            <select className="search-input" style={{ width: "100%" }} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Hạng sao</label>
            <select className="search-input" style={{ width: "100%" }} value={starFilter} onChange={(e) => setStarFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
            </select>
          </div>
          {hasActiveFilter && (
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: "100%" }}
                onClick={() => {
                  setKeyword("");
                  setStatusFilter("all");
                  setLocationFilter("all");
                  setStarFilter("all");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách khách sạn ({filteredHotels.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>⏳ Đang tải dữ liệu...</div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏨</div>
            <p className="empty-state-text">Không tìm thấy khách sạn phù hợp</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Mã</th>
                  <th>Khách sạn</th>
                  <th>Địa điểm</th>
                  <th>Hạng sao</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right", minWidth: 180 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "badge-default" };
                  const thumb = getMainImage(hotel);
                  return (
                    <tr key={hotel.ma_khach_san}>
                      <td>
                        <div style={{
                          width: 56, height: 44, borderRadius: 8, overflow: "hidden",
                          background: "#e8f5f1", border: "1px solid #d4ede6",
                        }}>
                          {thumb ? (
                            <img src={resolveUploadUrl(thumb.url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏨</div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "#3C7363" }}>#{hotel.ma_khach_san}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1a2e28" }}>{hotel.ten}</div>
                        <div style={{ fontSize: 12, color: "#5a7a72" }}>{hotel.doi_tac?.ten_cong_ty}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{hotel.dia_diem?.ten_dia_diem || "—"}</td>
                      <td style={{ color: "#b36b00" }}>
                        {hotel.so_sao ? `${"⭐".repeat(hotel.so_sao)}` : "—"}
                      </td>
                      <td>
                        <span className="badge badge-info">{hotel._count?.loai_phong ?? 0} loại</span>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/admin/hotels/${hotel.ma_khach_san}`)}
                          >
                            👁️ Chi tiết
                          </button>
                          {hotel.trang_thai === "cho_duyet" && (
                            <>
                              <button type="button" className="btn btn-success btn-sm" onClick={(e) => handleApprove(hotel, e)} title="Duyệt">✅</button>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => handleRequestInfo(hotel, e)} title="Yêu cầu sửa">📝</button>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => handleReject(hotel, e)} title="Từ chối">❌</button>
                            </>
                          )}
                          {hotel.trang_thai === "hoat_dong" && (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => handleLockToggle(hotel, e)} title="Khóa">🔒</button>
                          )}
                          {hotel.trang_thai === "bi_khoa" && (
                            <button type="button" className="btn btn-success btn-sm" onClick={(e) => handleLockToggle(hotel, e)} title="Mở khóa">🔓</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsPage;
