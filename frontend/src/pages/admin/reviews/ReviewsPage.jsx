import { useEffect, useState } from "react";
import api from "../../../services/api";
import { Eye, EyeOff } from "lucide-react";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";

const StarDisplay = ({ value }) => (
  <span style={{ fontSize: 13, fontWeight: 600, color: '#b36b00' }}>
    {Math.round(value || 0)}/5
  </span>
);

const StarBar = ({ phanBoSao, total }) => {
  if (!total) return <span style={{ fontSize: 12, color: "#888"}}>Chưa có dữ liệu</span>;
  return (
    <div style={{ marginTop: 6 }}>
      {phanBoSao.map(({ so_sao, so_luong }) => {
        const pct = Math.round((so_luong / total) * 100);
        return (
          <div key={so_sao} style={{ display:"flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12 }}>
            <span style={{ width: 28, color: "#5a7a72"}}>{so_sao} sao</span>
            <div style={{ flex: 1, height: 7, background:"#e8f5f1", borderRadius: 4, overflow: "hidden"}}>
              <div style={{ width: `${pct}%`, height:"100%", background: "#3C7363", borderRadius: 4 }} />
            </div>
            <span style={{ width: 28, textAlign: "right", color: "#888"}}>{so_luong}</span>
          </div>
        );
      })}
    </div>
  );
};

const REVIEW_STATUS = {
  cho_duyet: { label:"Chờ duyệt", cls: "badge-warning"},
  hien_thi:  { label:"Hiển thị", cls: "badge-success"},
  an:        { label:"Đã ẩn", cls: "badge-default"},
};

const TIME_PRESETS = [
  { value:"all", label: "Tất cả thời gian"},
  { value:"7", label: "7 ngày qua"},
  { value:"30", label: "30 ngày qua"},
  { value:"90", label: "90 ngày qua"},
  { value:"custom", label: "Tùy chọn"},
];

const getDateRange = (preset, customFrom, customTo) => {
  if (preset ==="all") return {};
  if (preset === "custom") {
    const r = {};
    if (customFrom) r.tu_ngay = customFrom;
    if (customTo) r.den_ngay = customTo;
    return r;
  }
  const days = Number(preset);
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { tu_ngay: from.toISOString().slice(0, 10) };
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

const truncate = (text, len = 60) => {
  if (!text) return "—";
  return text.length > len ? `${text.slice(0, len)}...` : text;
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f0f4f3", fontSize: 14 }}>
    <span style={{ width: 150, color: "#5a7a72", flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: "#1a2e28", fontWeight: 500 }}>{value ?? "—"}</span>
  </div>
);

const DetailModal = ({ review, onClose, onToggleStatus, actionLoading }) => {
  if (!review) return null;
  const st = REVIEW_STATUS[review.trang_thai] || { label: review.trang_thai, cls: "badge-default"};
  const isHidden = review.trang_thai ==="an";

  return (
    <div className="modal-overlay"onClick={onClose}>
      <div className="modal-box"style={{ maxWidth: 640, maxHeight:"90vh", overflowY: "auto"}} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Chi tiết đánh giá #{review.ma_danh_gia}</h3>
          <button type="button"className="modal-close"onClick={onClose}>×</button>
        </div>

        <div style={{ display:"flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap"}}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <StarDisplay value={review.so_sao} size={16} />
          <span style={{ fontWeight: 700, color:"#b36b00"}}>{review.so_sao}/5</span>
        </div>

        <div className="content-card"style={{ padding:"14px 16px", marginBottom: 14, background: "#f8fdfb"}}>
          <h4 style={{ margin:"0 0 10px", fontSize: 13, fontWeight: 600, color: "#3C7363"}}>Thông tin đánh giá</h4>
          <InfoRow label="Mã đánh giá"value={`#${review.ma_danh_gia}`} />
          <InfoRow label="Khách hàng"value={review.khach_hang?.ho_ten} />
          <InfoRow label="Khách sạn"value={review.ten_khach_san} />
          <InfoRow label="Loại phòng"value={review.ten_loai} />
          <InfoRow label="Mã đơn hàng"value={review.ma_don_hang} />
          <InfoRow label="Ngày đánh giá"value={formatDateTime(review.ngay_danh_gia)} />
          {review.ngay_duyet && <InfoRow label="Ngày duyệt"value={formatDateTime(review.ngay_duyet)} />}
          {(review.diem_sach_se || review.diem_dich_vu || review.diem_vi_tri) && (
            <div style={{ display:"flex", gap: 14, paddingTop: 10, fontSize: 13, color: "#5a7a72", flexWrap: "wrap"}}>
              {review.diem_sach_se && <span> Sạch sẽ: <strong>{review.diem_sach_se}/5</strong></span>}
              {review.diem_dich_vu && <span> Dịch vụ: <strong>{review.diem_dich_vu}/5</strong></span>}
              {review.diem_vi_tri && <span> Vị trí: <strong>{review.diem_vi_tri}/5</strong></span>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <h4 style={{ margin:"0 0 8px", fontSize: 13, fontWeight: 600, color: "#3C7363"}}>Nội dung đánh giá</h4>
          <div style={{
            padding:"14px 16px", background: "#fff", borderRadius: 10,
            border: "1px solid #e8f5f1", fontSize: 14, color: "#444", lineHeight: 1.7,
          }}>
            {review.noi_dung ? `"${review.noi_dung}"` : <span style={{ color: "#aaa"}}>Không có nội dung</span>}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin:"0 0 8px", fontSize: 13, fontWeight: 600, color: "#3C7363"}}>Phản hồi của đối tác</h4>
          {review.phan_hoi_doi_tac ? (
            <div style={{
              padding:"14px 16px", background: "#e8f5f1", borderRadius: 10,
              borderLeft: "3px solid #3C7363", fontSize: 14, color: "#444", lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 11, color: "#3C7363", marginBottom: 6 }}>
                {review.ten_doi_tac || "Đối tác"} · {formatDateTime(review.ngay_phan_hoi)}
              </div>
              {review.phan_hoi_doi_tac}
            </div>
          ) : (
            <div style={{ padding: 14, background: "#fafafa", borderRadius: 10, color: "#888", fontSize: 13, textAlign: "center"}}>
              Đối tác chưa phản hồi
            </div>
          )}
        </div>

        <TableActions style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          <ActionButton
            variant={isHidden ? 'unlock' : 'lock'}
            disabled={actionLoading}
            onClick={() => onToggleStatus(review)}
          >
            {actionLoading ? 'Đang xử lý...' : isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
          </ActionButton>
        </TableActions>
      </div>
    </div>
  );
};

const ReviewsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState({
    diem_trung_binh: 0, tong_danh_gia: 0, cho_duyet: 0, hien_thi: 0, an: 0, phan_bo_sao: [], theo_khach_san: [],
  });
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [starFilter, setStarFilter] = useState("all");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timePreset, setTimePreset] = useState("all");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const [detailReview, setDetailReview] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = { ...getDateRange(timePreset, tuNgay, denNgay) };
      if (hotelFilter !== "all") params.ma_khach_san = hotelFilter;
      if (starFilter !== "all") params.so_sao = starFilter;
      if (statusFilter !== "all") params.trang_thai = statusFilter;

      const res = await api.get("/admin/reviews", { params });
      const payload = res.data.data || {};
      setStats(payload.stats || {});
      setDanhSach(payload.danh_sach || []);
      setHotels(res.data.hotels || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tải đánh giá", "error");
      setDanhSach([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [starFilter, hotelFilter, statusFilter, timePreset, tuNgay, denNgay]);

  const handleToggleStatus = async (review) => {
    const isHidden = review.trang_thai === "an";
    const msg = isHidden
      ? `Hiện lại đánh giá #${review.ma_danh_gia}?`
      : `Ẩn đánh giá #${review.ma_danh_gia} khỏi hệ thống?`;
    if (!window.confirm(msg)) return;

    setActionLoading(true);
    try {
      const endpoint = isHidden ? "show":"hide";
      const res = await api.patch(`/admin/reviews/${review.ma_danh_gia}/${endpoint}`);
      showToast(res.data.message || "Thành công");
      setDetailReview((prev) => (prev?.ma_danh_gia === review.ma_danh_gia ? res.data.data : prev));
      await loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilter = hotelFilter !== "all"|| starFilter !=="all"|| statusFilter !=="all"|| timePreset !=="all";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý đánh giá</h1>
          <p className="page-subtitle">Kiểm duyệt, ẩn/hiện đánh giá và theo dõi chất lượng dịch vụ</p>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.type === "success"?"#e8f5f1":"#fff0f0",
          border: `1px solid ${toast.type === "success"?"#8FD9C4":"#ffb3b3"}`,
          color: toast.type === "success"?"#3C7363":"#e05c5c",
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === "success"?"":""} {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid"style={{ marginBottom: 16 }}>
        <div className="stat-card"style={{ borderTop:"3px solid #3C7363"}}>
          <div className="stat-card-label">Điểm trung bình</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="stat-card-value"style={{ color:"#3C7363"}}>
              {stats.diem_trung_binh ||"—"}
            </span>
            {stats.diem_trung_binh > 0 && <StarDisplay value={stats.diem_trung_binh} size={14} />}
          </div>
        </div>
        <div className="stat-card"style={{ borderTop:"3px solid #0958d9"}}>
          <div className="stat-card-label">Tổng đánh giá</div>
          <div className="stat-card-value"style={{ color:"#0958d9"}}>{stats.tong_danh_gia}</div>
        </div>
        <div className="stat-card"style={{ borderTop:"3px solid #b36b00"}}>
          <div className="stat-card-label">Chờ duyệt</div>
          <div className="stat-card-value"style={{ color:"#b36b00"}}>{stats.cho_duyet}</div>
        </div>
        <div className="stat-card"style={{ borderTop:"3px solid #52c41a"}}>
          <div className="stat-card-label">Đang hiển thị</div>
          <div className="stat-card-value"style={{ color:"#52c41a"}}>{stats.hien_thi}</div>
        </div>
        <div className="stat-card"style={{ borderTop:"3px solid #888"}}>
          <div className="stat-card-label">Đã ẩn</div>
          <div className="stat-card-value"style={{ color:"#888"}}>{stats.an}</div>
        </div>
        <div className="stat-card"style={{ borderTop:"3px solid #f1c40f"}}>
          <div className="stat-card-label">Phân bố sao</div>
          <StarBar phanBoSao={stats.phan_bo_sao || []} total={stats.tong_danh_gia} />
        </div>
      </div>

      {/* Filters */}
      <div className="content-card"style={{ marginBottom: 16, padding:"16px 20px"}}>
        <div style={{ display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "end"}}>
          <div>
            <label style={{ fontSize: 12, color:"#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Số sao</label>
            <select className="search-input"style={{ width:"100%"}} value={starFilter} onChange={(e) => setStarFilter(e.target.value)}>
              <option value="all">Tất cả sao</option>
              {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Khách sạn</label>
            <select className="search-input"style={{ width:"100%"}} value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
              <option value="all">Tất cả khách sạn</option>
              {hotels.map((h) => (
                <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Trạng thái</label>
            <select className="search-input"style={{ width:"100%"}} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="cho_duyet">Chờ duyệt</option>
              <option value="hien_thi">Hiển thị</option>
              <option value="an">Đã ẩn</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Thời gian</label>
            <select className="search-input"style={{ width:"100%"}} value={timePreset} onChange={(e) => setTimePreset(e.target.value)}>
              {TIME_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {timePreset ==="custom"&& (
            <>
              <div>
                <label style={{ fontSize: 12, color:"#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Từ ngày</label>
                <input type="date"className="search-input"style={{ width:"100%"}} value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color:"#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Đến ngày</label>
                <input type="date"className="search-input"style={{ width:"100%"}} value={denNgay} min={tuNgay} onChange={(e) => setDenNgay(e.target.value)} />
              </div>
            </>
          )}
          {hasActiveFilter && (
            <div>
              <button
                type="button"className="btn btn-ghost btn-sm"style={{ width:"100%"}}
                onClick={() => {
                  setStarFilter("all");
                  setHotelFilter("all");
                  setStatusFilter("all");
                  setTimePreset("all");
                  setTuNgay("");
                  setDenNgay("");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: 16, alignItems: "start"}}>
        {/* Stats table by hotel */}
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Thống kê theo khách sạn</h3>
          </div>
          {(stats.theo_khach_san || []).length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#888", fontSize: 13 }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ overflowX: "auto"}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Khách sạn</th>
                    <th>Điểm TB</th>
                    <th>SL</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.theo_khach_san.map((h) => (
                    <tr key={h.ma_khach_san}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{h.ten_khach_san}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <strong style={{ color: "#3C7363"}}>{h.diem_trung_binh}</strong>
                          <StarDisplay value={h.diem_trung_binh} size={10} />
                        </div>
                      </td>
                      <td><span className="badge badge-info">{h.so_danh_gia}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review list */}
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Danh sách đánh giá ({danhSach.length})</h3>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#5a7a72"}}> Đang tải...</div>
          ) : danhSach.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Không có đánh giá phù hợp bộ lọc</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto"}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Khách hàng</th>
                    <th>Khách sạn</th>
                    <th>Loại phòng</th>
                    <th>Điểm</th>
                    <th>Nội dung</th>
                    <th>Ngày ĐG</th>
                    <th>TT</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSach.map((rv) => {
                    const st = REVIEW_STATUS[rv.trang_thai] || { label: rv.trang_thai, cls:"badge-default"};
                    return (
                      <tr key={rv.ma_danh_gia}>
                        <td style={{ fontWeight: 600, color:"#3C7363"}}>#{rv.ma_danh_gia}</td>
                        <td style={{ fontWeight: 500 }}>{rv.khach_hang?.ho_ten ||"—"}</td>
                        <td style={{ fontSize: 13 }}>{rv.ten_khach_san}</td>
                        <td style={{ fontSize: 13 }}>{rv.ten_loai}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <StarDisplay value={rv.so_sao} size={12} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{rv.so_sao}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: "#555", maxWidth: 200 }}>{truncate(rv.noi_dung)}</td>
                        <td style={{ fontSize: 12, whiteSpace: "nowrap"}}>{formatDate(rv.ngay_danh_gia)}</td>
                        <td><span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span></td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => setDetailReview(rv)}
                          />
                          <ActionButton
                            variant={rv.trang_thai === "an" ? "unlock" : "lock"}
                            iconOnly
                            icon={rv.trang_thai === "an" ? Eye : EyeOff}
                            title={rv.trang_thai === "an" ? "Hiện đánh giá" : "Ẩn đánh giá"}
                            onClick={() => handleToggleStatus(rv)}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailReview && (
        <DetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ReviewsPage;
