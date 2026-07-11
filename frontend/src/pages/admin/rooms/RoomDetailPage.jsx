import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { resolveUploadUrl } from "../../../utils/media";
import ActionButton from "../../../components/common/ActionButton";
import BackButton from "../../../components/common/BackButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import MetricCard from "../../../components/common/management/MetricCard";
import Toast from "../../../components/common/Toast";
import useToast from "../../../hooks/useToast";
import { getAdminRoomTypeStatus } from "../../../constants/statuses";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Number(v) || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN");
const fmtPrice = (v) => (v != null && v !== "" ? `${fmt(v)} ₫` : "—");

const StarRating = ({ value }) => (
  <span style={{ fontSize: 13, fontWeight: 600, color: '#b36b00' }}>
    {Math.round(value || 0)}/5
  </span>
);

const InfoItem = ({ label, value, highlight }) => (
  <div style={{ padding: "10px 0", borderBottom: "1px solid #f0f4f3"}}>
    <div style={{ fontSize: 12, color:"#5a7a72", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: highlight ? 600 : 500, color: highlight ? "#3C7363":"#1a2e28"}}>
      {value ??"—"}
    </div>
  </div>
);

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.backTo || "/admin/room-types";
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("amenities");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { toast, showToast } = useToast();

  const loadRoom = useCallback(() => {
    setLoading(true);
    api.get(`/admin/room-types/${id}`)
      .then((res) => setRoom(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  const handleToggleStatus = async () => {
    const isHidden = room.trang_thai === "an";
    const msg = isHidden
      ? `Mở lại loại phòng "${room.ten_loai}"?`
      : `Ẩn loại phòng "${room.ten_loai}"? Phòng sẽ ngừng hiển thị trên hệ thống.`;
    if (!window.confirm(msg)) return;

    setActionLoading(true);
    try {
      const endpoint = isHidden ? "show":"hide";
      const res = await api.patch(`/admin/room-types/${id}/${endpoint}`);
      setRoom((prev) => ({ ...prev, ...res.data.data, trang_thai: res.data.data.trang_thai }));
      showToast(isHidden ? "Đã mở lại loại phòng" : "Đã ẩn loại phòng");
      loadRoom();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#5a7a72"}}> Đang tải chi tiết...</div>;
  }

  if (error || !room) {
    return (
      <div className="content-card"style={{ textAlign:"center", padding: 48 }}>
        <p style={{ color: "#e05c5c", marginBottom: 16 }}>{error || "Không tìm thấy loại phòng"}</p>
        <BackButton variant="outline" onClick={() => navigate(backTo)} />
      </div>
    );
  }

  const st = getAdminRoomTypeStatus(room.trang_thai);
  const isHidden = room.trang_thai ==="an";
  const partnerLocked = Boolean(room.khoa_do_doi_tac);
  const mainImg = room.hinh_anh?.find((i) => i.la_anh_chinh) || room.hinh_anh?.[0];
  const amenities = room.loai_phong_tien_nghi || [];
  const inv = room.tinh_trang_phong || {};
  const gia = room.gia || {};
  const reviews = room.danh_gia || [];
  const reviewStats = room.thong_ke_danh_gia || {};

  const TABS = [
    { id: "amenities", label: "Tiện nghi", count: amenities.length },
    { id: "images", label: "Hình ảnh", count: room.hinh_anh?.length || 0 },
    { id: "reviews", label: "Đánh giá", count: reviewStats.tong || 0 },
  ];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý loại phòng"
        onBack={() => navigate(backTo)}
      />

      <Toast toast={toast} />

      <div style={{ marginBottom: 20 }}>
        <div className="content-card"style={{ padding: 0, overflow:"hidden"}}>
          <div style={{ display:"grid", gridTemplateColumns: mainImg ? "280px 1fr":"1fr", minHeight: 200 }}>
            {mainImg && (
              <div style={{ position: "relative"}}>
                <img
                  src={resolveUploadUrl(mainImg.url)}
                  alt=""style={{ width:"100%", height: "100%", minHeight: 200, objectFit: "cover"}}
                />
              </div>
            )}
            <div style={{ padding:"24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div style={{ display:"flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap"}}>
                    <h1 className="page-title"style={{ margin: 0, fontSize: 24 }}>{room.ten_loai}</h1>
                    <span className={`badge ${st.badgeCls}`}>{st.label}</span>
                  </div>
                  <p style={{ margin:"0 0 4px", color: "#5a7a72", fontSize: 14 }}>
                     <> Khách sạn: </><strong style={{ color: "#1a2e28"}}>{room.khach_san?.ten}</strong>
                    {room.khach_san?.doi_tac?.ten_cong_ty && (
                      <> <br /> Đối tác: <strong>{room.khach_san.doi_tac.ten_cong_ty}</strong></>
                    )}
                  </p>
                  {room.khach_san?.dia_diem?.ten_dia_diem && (
                    <p style={{ margin: 0, fontSize: 13, color:"#888"}}> <> Địa điểm: </>{room.khach_san.dia_diem.ten_dia_diem}</p>
                  )}
                </div>
                <ActionButton
                  variant={isHidden ? "unlock" : "lock"}
                  onClick={handleToggleStatus}
                  disabled={actionLoading || (isHidden && partnerLocked)}
                  title={partnerLocked && isHidden ? 'Bị khóa do đối tác' : undefined}
                  style={{ flexShrink: 0 }}
                >
                  {actionLoading ? "Đang xử lý..." : isHidden ? "Mở loại phòng" : "Ẩn loại phòng"}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="content-card">
          <h3 className="content-card-title"style={{ marginBottom: 4 }}> Thông tin loại phòng</h3>
          <InfoItem label="Tên loại phòng"value={room.ten_loai} />
          <InfoItem label="Khách sạn"value={room.khach_san?.ten} />
          <InfoItem label="Mô tả"value={room.mo_ta ||"Chưa có mô tả"} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px"}}>
            <InfoItem label="Diện tích"value={room.dien_tich ? `${room.dien_tich} m²` :"—"} />
            <InfoItem label="Sức chứa"value={`${room.suc_chua} khách`} />
            <InfoItem label="Số giường"value={`${room.so_giuong} giường`} />
            <InfoItem label="Loại giường"value={room.loai_giuong} />
          </div>
        </div>

        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Bảng giá</h3>
          <div className="mgmt-metric-grid mgmt-metric-grid--3">
            <MetricCard
              label="Giá cơ bản"
              value={fmtPrice(gia.gia_co_ban ?? room.gia_co_ban)}
              color="#3C7363"
            />
            <MetricCard label="Cuối tuần" value={fmtPrice(gia.gia_cuoi_tuan)} color="#b36b00" />
            <MetricCard label="Lễ / Tết" value={fmtPrice(gia.gia_le)} color="#e05c5c" />
          </div>

          <h3 className="content-card-title" style={{ margin: '20px 0 12px' }}>Tình trạng phòng</h3>
          <div className="mgmt-metric-grid mgmt-metric-grid--4">
            <MetricCard
              label="Tổng số phòng"
              value={inv.tong_so_phong ?? room.so_luong_phong ?? 0}
              color="#3C7363"
            />
            <MetricCard label="Đang mở bán" value={inv.dang_mo_ban ?? 0} color="#52c41a" />
            <MetricCard label="Còn trống" value={inv.con_trong ?? inv.dang_mo_ban ?? 0} color="#3C7363" />
            <MetricCard label="Đã đặt" value={inv.da_dat ?? 0} color="#b36b00" />
            <MetricCard label="Đang khóa" value={inv.dang_khoa ?? 0} color="#e05c5c" />
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div style={{ display:"flex", gap: 8, marginBottom: 14, flexWrap: "wrap"}}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"className={`btn btn-sm ${activeTab === tab.id ?"btn-primary":"btn-ghost"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 6, background: activeTab === tab.id ? "rgba(255,255,255,0.3)":"#e8f5f1",
                borderRadius: 10, padding: "1px 7px", fontSize: 11,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "amenities"&& (
        <div className="content-card">
          {amenities.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Chưa có tiện nghi nào</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {amenities.map((tn) => (
                <div
                  key={tn.ma_lp_tien_nghi}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10,
                    background: "#f8fdfb", border: "1px solid #d4ede6",
                  }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 8, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0, border: "1px solid #e8f5f1",
                  }}>
                    </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1a2e28"}}>{tn.tien_nghi?.ten}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab ==="images"&& (
        <div className="content-card">
          {!room.hinh_anh?.length ? (
            <div className="empty-state">
              <p className="empty-state-text">Chưa có hình ảnh</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {room.hinh_anh.map((img) => (
                <div
                  key={img.ma_hinh_anh}
                  role="button"tabIndex={0}
                  onClick={() => setLightbox(resolveUploadUrl(img.url))}
                  onKeyDown={(e) => e.key ==="Enter"&& setLightbox(resolveUploadUrl(img.url))}
                  style={{
                    borderRadius: 12, overflow:"hidden", border: "1px solid #d4ede6",
                    position: "relative", cursor: "pointer", transition: "transform 0.15s",
                  }}
                >
                  <img src={resolveUploadUrl(img.url)} alt=""style={{ width:"100%", height: 150, objectFit: "cover", display: "block"}} />
                  {img.la_anh_chinh && (
                    <span className="badge badge-success"style={{ position:"absolute", top: 8, left: 8, fontSize: 11 }}>Ảnh chính</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews"&& (
        <div className="content-card">
          {reviewStats.tong > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 20, padding: "16px 20px",
              background: "#fffbf0", borderRadius: 12, border: "1px solid #ffe9b0", marginBottom: 20,
            }}>
              <div style={{ textAlign: "center"}}>
                <div style={{ fontSize: 36, fontWeight: 700, color:"#b36b00", lineHeight: 1 }}>
                  {reviewStats.diem_trung_binh}
                </div>
                <StarRating value={reviewStats.diem_trung_binh} size={16} />
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{reviewStats.tong} đánh giá</div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap"}}>
                {reviewStats.diem_sach_se && (
                  <div style={{ fontSize: 13 }}> Sạch sẽ: <strong>{reviewStats.diem_sach_se}/5</strong></div>
                )}
                {reviewStats.diem_dich_vu && (
                  <div style={{ fontSize: 13 }}> Dịch vụ: <strong>{reviewStats.diem_dich_vu}/5</strong></div>
                )}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Chưa có đánh giá nào cho loại phòng này</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.map((rv) => (
                <div
                  key={rv.ma_danh_gia}
                  style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid #eef2f1", background: "#fafcfb"}}
                >
                  <div style={{ display:"flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{rv.khach_hang?.ho_ten || "Khách hàng"}</div>
                      <div style={{ fontSize: 12, color: "#888"}}>
                        {fmtDate(rv.ngay_danh_gia)}
                        {rv.ma_don_hang && <> · Đơn <strong>{rv.ma_don_hang}</strong></>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems: "center", gap: 8 }}>
                      <StarRating value={rv.so_sao} />
                      <span style={{ fontWeight: 700, color: "#b36b00"}}>{rv.so_sao}/5</span>
                    </div>
                  </div>
                  {rv.noi_dung && (
                    <p style={{ margin:"0 0 8px", fontSize: 14, color: "#444", lineHeight: 1.6 }}>{rv.noi_dung}</p>
                  )}
                  {rv.phan_hoi_doi_tac && (
                    <div style={{ padding: "10px 12px", background: "#f0f7f5", borderRadius: 8, fontSize: 13, color: "#3C7363"}}>
                       Phản hồi đối tác: {rv.phan_hoi_doi_tac}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <div
          role="button"tabIndex={0}
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key ==="Escape"&& setLightbox(null)}
          style={{
            position:"fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <img src={lightbox} alt=""style={{ maxWidth:"90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
};

export default RoomDetailPage;
