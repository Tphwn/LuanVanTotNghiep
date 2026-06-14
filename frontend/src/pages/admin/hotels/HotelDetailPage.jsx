import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import adminHotelService from "../../../services/adminHotelService";
import { approveHotel, rejectHotel, requestInfoHotel, lockHotel, unlockHotel } from "../../../redux/slices/adminHotelSlice";
import { resolveUploadUrl } from "../../../utils/media";

// ===== COMPONENT HỖ TRỢ (GIỐNG USER DETAIL) =====
const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", padding: "10px 0", borderBottom: "0.5px solid #f0f0f0", fontSize: 14, gap: 12 }}>
    <span style={{ width: 180, color: "#5a7a72", flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: "#1a2e28", fontWeight: 500, flex: 1 }}>{value || "—"}</span>
  </div>
);

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const loadHotel = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminHotelService.getById(id);
      setHotel(res.data.data || res.data);
    } catch (err) {
      console.error("Lỗi tải khách sạn:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

useEffect(() => {
    // 1. Tạo một hàm async riêng bên trong để gọi loadHotel
    const fetchData = async () => {
      await loadHotel();
    };

    // 2. Gọi hàm đó
    fetchData();
    
    // 3. Mảng dependency [loadHotel] là chính xác rồi
  }, [loadHotel]);

  const handleAction = async (actionType) => {
    let actionPromise;
    if (actionType === 'approve' && window.confirm("Duyệt khách sạn này?")) actionPromise = dispatch(approveHotel(id));
    else if (actionType === 'reject') {
      const reason = window.prompt("Lý do từ chối:");
      if (reason) actionPromise = dispatch(rejectHotel({ id, lyDo: reason }));
    } else if (actionType === 'request_info') {
      const note = window.prompt("Yêu cầu bổ sung gì?");
      if (note) actionPromise = dispatch(requestInfoHotel({ id, ghiChu: note }));
    } else if (actionType === 'lock' && window.confirm("Khóa khách sạn?")) actionPromise = dispatch(lockHotel(id));
    else if (actionType === 'unlock' && window.confirm("Mở khóa lại?")) actionPromise = dispatch(unlockHotel(id));
    
    if (actionPromise) {
        await actionPromise;
        loadHotel();
    }
  };

  if (loading) return <div className="main-panel">⏳ Đang tải...</div>;
  if (!hotel) return <div className="main-panel">Không tìm thấy khách sạn!</div>;

  return (
    <div className="main-panel">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin/hotels")} style={{ marginBottom: 8 }}>← Quay lại danh sách</button>
          <h1 className="page-title">{hotel.ten}</h1>
          <p className="page-subtitle">#{hotel.ma_khach_san} · {hotel.dia_chi}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            {hotel.trang_thai === "cho_duyet" && (
                <>
                    <button className="btn btn-primary" onClick={() => handleAction('approve')}>✅ Duyệt</button>
                    <button className="btn btn-danger" onClick={() => handleAction('reject')}>❌ Từ chối</button>
                    <button className="btn btn-info" onClick={() => handleAction('request_info')}>📝 Yêu cầu sửa</button>
                </>
            )}
            {hotel.trang_thai === "hoat_dong" && <button className="btn btn-danger" onClick={() => handleAction('lock')}>🔒 Khóa</button>}
            {hotel.trang_thai === "bi_khoa" && <button className="btn btn-success" onClick={() => handleAction('unlock')}>🔓 Mở khóa</button>}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "0.5px solid #d4ede6", marginBottom: 16 }}>
        {["info", "images"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid #3C7363" : "2px solid transparent",
              color: activeTab === tab ? "#3C7363" : "#5a7a72", fontWeight: activeTab === tab ? 600 : 400
          }}>
            {tab === "info" ? "👤 Thông tin chi tiết" : "🖼 Hình ảnh"}
          </button>
        ))}
      </div>

      {/* NỘI DUNG CHI TIẾT */}
      {activeTab === "info" && (
        <div className="form-grid">
          <div className="content-card">
            <h3 className="content-card-title">🔑 Thông tin khách sạn</h3>
            <InfoRow label="Tên khách sạn" value={hotel.ten} />
            <InfoRow label="Địa chỉ" value={hotel.dia_chi} />
            <InfoRow label="Số sao" value={`${hotel.so_sao || 0} ⭐`} />
            <InfoRow label="Mô tả" value={hotel.mo_ta} />
          </div>
          <div className="content-card">
            <h3 className="content-card-title">🏢 Hồ sơ đối tác</h3>
            <InfoRow label="Tên công ty" value={hotel.doi_tac?.ten_cong_ty} />
            <InfoRow label="Email liên hệ" value={hotel.doi_tac?.email} />
            <InfoRow label="Số điện thoại" value={hotel.doi_tac?.so_dien_thoai} />
            <InfoRow label="Trạng thái ĐT" value={hotel.doi_tac?.trang_thai} />
          </div>
        </div>
      )}

      {activeTab === "images" && (
        <div className="content-card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {hotel.hinh_anh?.map((img, idx) => (
               <img key={idx} src={resolveUploadUrl(img.url)} alt="Hotel" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 8 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default HotelDetailPage;