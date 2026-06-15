import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import adminHotelService from "../../../services/adminHotelService";
import {
  approveHotel, rejectHotel, requestInfoHotel, lockHotel, unlockHotel,
} from "../../../redux/slices/adminHotelSlice";
import { resolveUploadUrl } from "../../../utils/media";
import { getAmenityIcon } from "../../../utils/amenityIcons";

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "badge-warning" },
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "badge-info" },
  da_duyet: { label: "Đã duyệt", cls: "badge-info" },
};

const ROOM_STATUS = {
  hoat_dong: { label: "Đang bán", cls: "badge-success" },
  an: { label: "Đã ẩn", cls: "badge-warning" },
};

const PARTNER_STATUS = {
  hoat_dong: { label: "Đang hợp tác", cls: "badge-success" },
  bi_khoa: { label: "Ngưng hợp tác", cls: "badge-danger" },
};

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Number(v) || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const formatTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const InfoRow = ({ label, value }) => (
  <div style={{ padding: "10px 0", borderBottom: "1px solid #f0f4f3" }}>
    <div style={{ fontSize: 12, color: "#5a7a72", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#1a2e28", lineHeight: 1.5 }}>{value ?? "—"}</div>
  </div>
);

const StatMini = ({ label, value, color, icon }) => (
  <div style={{
    textAlign: "center", padding: "16px 12px", borderRadius: 12,
    background: `${color}08`, border: `1px solid ${color}33`,
  }}>
    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: "#5a7a72", marginTop: 4 }}>{label}</div>
  </div>
);

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [actionLoading, setActionLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const loadHotel = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminHotelService.getById(id);
      setHotel(res.data.data || res.data);
    } catch {
      setHotel(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadHotel(); }, [loadHotel]);

  const handleAction = async (actionType) => {
    let actionPromise;
    if (actionType === "approve" && window.confirm("Duyệt khách sạn này hoạt động trên sàn?")) {
      actionPromise = dispatch(approveHotel(id));
    } else if (actionType === "reject") {
      const reason = window.prompt("Nhập lý do từ chối:");
      if (reason?.trim()) actionPromise = dispatch(rejectHotel({ id, lyDo: reason.trim() }));
    } else if (actionType === "request_info") {
      const note = window.prompt("Yêu cầu đối tác bổ sung/sửa gì?");
      if (note?.trim()) actionPromise = dispatch(requestInfoHotel({ id, ghiChu: note.trim() }));
    } else if (actionType === "lock" && window.confirm("Khóa khách sạn này?")) {
      actionPromise = dispatch(lockHotel(id));
    } else if (actionType === "unlock" && window.confirm("Mở khóa khách sạn này?")) {
      actionPromise = dispatch(unlockHotel(id));
    }

    if (actionPromise) {
      setActionLoading(true);
      try {
        await actionPromise;
        await loadHotel();
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#5a7a72" }}>⏳ Đang tải...</div>;
  }

  if (!hotel) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "#e05c5c", marginBottom: 16 }}>Không tìm thấy khách sạn</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate("/admin/hotels")}>
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "badge-default" };
  const partner = hotel.doi_tac;
  const partnerUser = partner?.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung;
  const amenities = hotel.khach_san_tien_nghi || [];
  const rooms = hotel.loai_phong || [];
  const mainImg = hotel.hinh_anh?.find((i) => i.la_anh_chinh) || hotel.hinh_anh?.[0];

  const tabs = [
    { id: "info", label: "📋 Thông tin" },
    { id: "amenities", label: "🛎️ Tiện nghi", count: amenities.length },
    { id: "rooms", label: "🛏️ Loại phòng", count: rooms.length },
    { id: "images", label: "🖼️ Hình ảnh", count: hotel.hinh_anh?.length || 0 },
  ];

  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => navigate("/admin/hotels")}>
        ← Quay lại danh sách
      </button>

      {/* Hero */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: mainImg ? "280px 1fr" : "1fr", minHeight: 200 }}>
          {mainImg && (
            <img
              src={resolveUploadUrl(mainImg.url)}
              alt=""
              style={{ width: "100%", height: "100%", minHeight: 200, objectFit: "cover" }}
            />
          )}
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: 24 }}>{hotel.ten}</h1>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                {hotel.so_sao > 0 && (
                  <span style={{ color: "#b36b00", fontSize: 14 }}>{"⭐".repeat(hotel.so_sao)}</span>
                )}
              </div>
              <p style={{ margin: "0 0 4px", color: "#5a7a72", fontSize: 14 }}>
                #{hotel.ma_khach_san} · {hotel.dia_diem?.ten_dia_diem} · {partner?.ten_cong_ty}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#888" }}>📍 {hotel.dia_chi}</p>
              {hotel.ly_do_tu_choi && (hotel.trang_thai === "tu_choi" || hotel.trang_thai === "yeu_cau_sua") && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", background: "#fff8f0",
                  borderRadius: 8, border: "1px solid #ffe0b0", fontSize: 13, color: "#b36b00",
                }}>
                  💬 {hotel.trang_thai === "tu_choi" ? "Lý do từ chối" : "Yêu cầu bổ sung"}: {hotel.ly_do_tu_choi}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {hotel.trang_thai === "cho_duyet" && (
                <>
                  <button type="button" className="btn btn-success btn-sm" disabled={actionLoading} onClick={() => handleAction("approve")}>
                    {actionLoading ? "⏳..." : "✅ Duyệt"}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={actionLoading} onClick={() => handleAction("request_info")}>
                    📝 Yêu cầu sửa
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={actionLoading} onClick={() => handleAction("reject")}>
                    ❌ Từ chối
                  </button>
                </>
              )}
              {hotel.trang_thai === "hoat_dong" && (
                <button type="button" className="btn btn-ghost btn-sm" disabled={actionLoading} onClick={() => handleAction("lock")}>
                  🔒 Khóa khách sạn
                </button>
              )}
              {hotel.trang_thai === "bi_khoa" && (
                <button type="button" className="btn btn-success btn-sm" disabled={actionLoading} onClick={() => handleAction("unlock")}>
                  🔓 Mở khóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatMini label="Loại phòng" value={hotel._count?.loai_phong ?? rooms.length} color="#3C7363" icon="🛏️" />
        <StatMini label="Tiện nghi" value={amenities.length} color="#0958d9" icon="🛎️" />
        <StatMini label="Hạng sao" value={hotel.so_sao || "—"} color="#b36b00" icon="⭐" />
        <StatMini
          label="Hoa hồng"
          value={hotel.phan_tram_hoa_hong != null ? `${hotel.phan_tram_hoa_hong}%` : "Mặc định"}
          color="#7c3aed"
          icon="💼"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{
                marginLeft: 6, background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "#e8f5f1",
                borderRadius: 10, padding: "1px 7px", fontSize: 11,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === "info" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="content-card">
            <h3 className="content-card-title" style={{ marginBottom: 12 }}>🏨 Thông tin khách sạn</h3>
            <InfoRow label="Tên khách sạn" value={hotel.ten} />
            <InfoRow label="Địa điểm" value={hotel.dia_diem?.ten_dia_diem} />
            <InfoRow label="Địa chỉ" value={hotel.dia_chi} />
            <InfoRow label="Hạng sao" value={hotel.so_sao ? `${hotel.so_sao} sao` : "Chưa xếp hạng"} />
            <InfoRow label="Giờ nhận phòng" value={formatTime(hotel.gio_nhan_phong)} />
            <InfoRow label="Giờ trả phòng" value={formatTime(hotel.gio_tra_phong)} />
            <InfoRow label="Ngày đăng ký" value={formatDateTime(hotel.ngay_tao)} />
            <InfoRow label="Ngày duyệt" value={formatDateTime(hotel.ngay_duyet)} />
            {hotel.mo_ta && (
              <div style={{ marginTop: 14, padding: 12, background: "#f8fdfb", borderRadius: 8, fontSize: 14, color: "#5a7a72", lineHeight: 1.6 }}>
                {hotel.mo_ta}
              </div>
            )}
          </div>

          <div className="content-card">
            <h3 className="content-card-title" style={{ marginBottom: 12 }}>🏢 Đối tác quản lý</h3>
            <InfoRow label="Tên công ty" value={partner?.ten_cong_ty} />
            <InfoRow label="Mã đối tác" value={partner ? `#${partner.ma_doi_tac}` : "—"} />
            <InfoRow label="Email đăng nhập" value={partnerUser?.email} />
            <InfoRow label="Email liên hệ" value={partner?.email_lien_he || partnerUser?.email} />
            <InfoRow label="SĐT" value={partner?.so_dien_thoai || partnerUser?.so_dien_thoai} />
            <InfoRow label="Mã số thuế" value={partner?.ma_so_thue} />
            <InfoRow label="Địa chỉ công ty" value={partner?.dia_chi} />
            <InfoRow
              label="Trạng thái hợp tác"
              value={PARTNER_STATUS[partner?.trang_thai]?.label || partner?.trang_thai}
            />
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => partnerUser && navigate(`/admin/users/${partner.ma_nguoi_dung}`)}
              >
                👤 Xem tài khoản đối tác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Amenities */}
      {activeTab === "amenities" && (
        <div className="content-card">
          {amenities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛎️</div>
              <p className="empty-state-text">Chưa có tiện nghi nào</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {amenities.map((tn) => (
                <div
                  key={tn.ma_ks_tien_nghi}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 10,
                    background: "#f8fdfb", border: "1px solid #d4ede6",
                  }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 8, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, border: "1px solid #e8f5f1",
                  }}>
                    {getAmenityIcon(tn.tien_nghi?.bieu_tuong, tn.tien_nghi?.ten)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{tn.tien_nghi?.ten}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Rooms */}
      {activeTab === "rooms" && (
        <div className="content-card">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛏️</div>
              <p className="empty-state-text">Chưa có loại phòng nào</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loại phòng</th>
                    <th>Giá cơ bản</th>
                    <th>Sức chứa</th>
                    <th>Số phòng</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const rst = ROOM_STATUS[room.trang_thai] || { label: room.trang_thai, cls: "badge-default" };
                    return (
                      <tr key={room.ma_loai_phong}>
                        <td style={{ fontWeight: 500 }}>{room.ten_loai}</td>
                        <td style={{ fontWeight: 600, color: "#b36b00" }}>{fmt(room.gia_co_ban)} ₫</td>
                        <td>{room.suc_chua} khách</td>
                        <td>{room.so_luong_phong} phòng</td>
                        <td><span className={`badge ${rst.cls}`}>{rst.label}</span></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/admin/room-types/${room.ma_loai_phong}`)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Images */}
      {activeTab === "images" && (
        <div className="content-card">
          {!hotel.hinh_anh?.length ? (
            <div className="empty-state">
              <div className="empty-state-icon">🖼️</div>
              <p className="empty-state-text">Chưa có hình ảnh</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {hotel.hinh_anh.map((img) => (
                <div
                  key={img.ma_hinh_anh}
                  role="button"
                  tabIndex={0}
                  onClick={() => setLightbox(resolveUploadUrl(img.url))}
                  onKeyDown={(e) => e.key === "Enter" && setLightbox(resolveUploadUrl(img.url))}
                  style={{
                    borderRadius: 12, overflow: "hidden", border: "1px solid #d4ede6",
                    position: "relative", cursor: "pointer",
                  }}
                >
                  <img src={resolveUploadUrl(img.url)} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                  {img.la_anh_chinh && (
                    <span className="badge badge-success" style={{ position: "absolute", top: 8, left: 8, fontSize: 11 }}>Ảnh chính</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
};

export default HotelDetailPage;
