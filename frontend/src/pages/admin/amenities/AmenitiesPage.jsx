import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAmenities, addAmenity, updateAmenity, removeAmenity,
  fetchRequests, approveRequest, rejectRequest,
} from "../../../store/slices/amenitySlice";

const LOAI_LABEL = {
  khach_san: { label: "Khách sạn", cls: "badge-info" },
  phong:     { label: "Loại Phòng",     cls: "badge-success" },
  ca_hai:    { label: "Cả hai",    cls: "badge-warning" },
};

const REQUEST_STATUS = {
  cho_xu_ly: { label: "Chờ xử lý", cls: "badge-warning" },
  da_tao:    { label: "Đã tạo",    cls: "badge-success" },
  tu_choi:   { label: "Từ chối",   cls: "badge-danger" },
};

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {}
  );

  const [activeTab, setActiveTab] = useState("list");
  const [form, setForm] = useState({ ten: "", bieu_tuong: "", loai: "khach_san" });
  const [editId, setEditId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [filterLoai, setFilterLoai] = useState("all");

  // Modal từ chối
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchRequests());
  }, [dispatch]);

  // Số yêu cầu chờ xử lý
  const pendingCount = requests.filter(r => r.trang_thai === "cho_xu_ly").length;

  // Lọc danh sách tiện nghi
  const filteredList = list.filter((item) => {
    const matchLoai = filterLoai === "all" || item.loai === filterLoai;
    const matchKeyword = item.ten?.toLowerCase().includes(keyword.toLowerCase());
    return matchLoai && matchKeyword;
  });

  // Submit thêm/sửa
  const handleSubmit = () => {
    if (!form.ten.trim()) return alert("Vui lòng nhập tên tiện nghi");
    if (editId) {
      dispatch(updateAmenity({ id: editId, data: form }));
      setEditId(null);
    } else {
      dispatch(addAmenity(form));
    }
    setForm({ ten: "", bieu_tuong: "", loai: "khach_san" });
  };

  const handleEdit = (item) => {
    setEditId(item.ma_tien_nghi);
    setForm({ ten: item.ten, bieu_tuong: item.bieu_tuong || "", loai: item.loai });
    setActiveTab("list");
  };

  const handleDelete = (id) => {
    if (window.confirm("Xóa tiện nghi này?")) dispatch(removeAmenity(id));
  };

  const handleApprove = (id) => {
    if (window.confirm("Duyệt yêu cầu và tạo tiện nghi mới?")) {
      dispatch(approveRequest(id));
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");
    dispatch(rejectRequest({ id: rejectModal, phan_hoi: rejectReason }));
    setRejectModal(null);
    setRejectReason("");
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tiện nghi</h1>
          <p className="page-subtitle">
            Thêm, sửa, xóa tiện nghi và xử lý đề xuất từ đối tác
          </p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
        <div className="stat-card" style={{ borderTop: "3px solid #3C7363" }}>
          <div className="stat-card-label">Tổng tiện nghi</div>
          <div className="stat-card-value" style={{ color: "#3C7363" }}>{list.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #0958d9" }}>
          <div className="stat-card-label">Đề xuất từ đối tác</div>
          <div className="stat-card-value" style={{ color: "#0958d9" }}>{requests.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #b36b00" }}>
          <div className="stat-card-label">Chờ xử lý</div>
          <div className="stat-card-value" style={{ color: "#b36b00" }}>{pendingCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "0.5px solid #d4ede6", marginBottom: 16 }}>
        {[
          { id: "list",     label: `🛎️ Danh sách tiện nghi (${list.length})` },
          { id: "requests", label: `📬 Đề xuất từ đối tác`, badge: pendingCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              background: "none", border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #3C7363" : "2px solid transparent",
              color: activeTab === tab.id ? "#3C7363" : "#5a7a72",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer", fontSize: 14,
              marginBottom: -1,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {tab.label}
            {/* Badge số chờ xử lý */}
            {tab.badge > 0 && (
              <span style={{
                background: "#e05c5c", color: "#fff",
                borderRadius: "50%", width: 20, height: 20,
                display: "inline-flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 700,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== TAB: DANH SÁCH TIỆN NGHI ===== */}
      {activeTab === "list" && (
        <>
          {/* Form thêm/sửa */}
          <div className="content-card" style={{ marginBottom: 16 }}>
            <h3 className="content-card-title" style={{ marginBottom: 14 }}>
              {editId ? "✏️ Chỉnh sửa tiện nghi" : "➕ Thêm tiện nghi mới"}
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "2 1 200px" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Tên tiện nghi <span style={{ color: "#e05c5c" }}>*</span>
                </label>
                <input
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="VD: Hồ bơi, WiFi miễn phí..."
                  value={form.ten}
                  onChange={(e) => setForm({ ...form, ten: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Icon / Emoji
                </label>
                <input
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="🏊 🛜 🅿️..."
                  value={form.bieu_tuong}
                  onChange={(e) => setForm({ ...form, bieu_tuong: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Loại
                </label>
                <select
                  className="search-input"
                  style={{ width: "100%" }}
                  value={form.loai}
                  onChange={(e) => setForm({ ...form, loai: e.target.value })}
                >
                  <option value="khach_san">Khách sạn</option>
                  <option value="phong">Loại Phòng</option>
                  <option value="ca_hai">Cả hai</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  {editId ? "Cập nhật" : "Thêm mới"}
                </button>
                {editId && (
                  <button className="btn btn-ghost" onClick={() => {
                    setEditId(null);
                    setForm({ ten: "", bieu_tuong: "", loai: "khach_san" });
                  }}>
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="search-bar" style={{ marginBottom: 12 }}>
            <input
              className="search-input"
              placeholder="🔍 Tìm kiếm tên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ flex: 2 }}
            />
            <select
              className="search-input"
              value={filterLoai}
              onChange={(e) => setFilterLoai(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="all">Tất cả loại</option>
              <option value="khach_san">Khách sạn</option>
              <option value="phong">Loại Phòng</option>
              <option value="ca_hai">Cả hai</option>
            </select>
          </div>

          {/* Bảng tiện nghi */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách ({filteredList.length})</h3>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#5a7a72" }}>
                ⏳ Đang tải...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛎️</div>
                <p className="empty-state-text">Chưa có tiện nghi nào</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Icon</th>
                    <th>Tên tiện nghi</th>
                    <th>Loại</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const loai = LOAI_LABEL[item.loai] || { label: item.loai, cls: "badge-default" };
                    return (
                      <tr key={item.ma_tien_nghi}>
                        <td style={{ color: "#5a7a72" }}>#{item.ma_tien_nghi}</td>
                        <td style={{ fontSize: 22 }}>{item.bieu_tuong}</td>
                        <td style={{ fontWeight: 500 }}>{item.ten}</td>
                        <td><span className={`badge ${loai.cls}`}>{loai.label}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>
                              ✏️ Sửa
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.ma_tien_nghi)}>
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== TAB: ĐỀ XUẤT TỪ ĐỐI TÁC ===== */}
      {activeTab === "requests" && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">📬 Đề xuất tiện nghi từ đối tác</h3>
            {pendingCount > 0 && (
              <span className="badge badge-warning">{pendingCount} chờ xử lý</span>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">Chưa có đề xuất nào từ đối tác</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Đối tác</th>
                  <th>Tên đề xuất</th>
                  <th>Mô tả</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Phản hồi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const st = REQUEST_STATUS[req.trang_thai] || {
                    label: req.trang_thai, cls: "badge-default"
                  };
                  const isPending = req.trang_thai === "cho_xu_ly";
                  return (
                    <tr key={req.ma_yeu_cau}>
                      <td style={{ color: "#5a7a72" }}>#{req.ma_yeu_cau}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{req.doi_tac?.ten_cong_ty || "—"}</div>
                        <div style={{ fontSize: 12, color: "#5a7a72" }}>
                          {req.doi_tac?.nguoi_dung?.email}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{req.ten_de_xuat}</td>
                      <td style={{ color: "#5a7a72", fontSize: 13, maxWidth: 200 }}>
                        {req.mo_ta || "—"}
                      </td>
                      <td style={{ color: "#5a7a72", fontSize: 13 }}>
                        {new Date(req.ngay_yeu_cau).toLocaleDateString("vi-VN")}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ fontSize: 13, color: "#5a7a72", maxWidth: 180 }}>
                        {req.phan_hoi || "—"}
                      </td>
                      <td>
                        {isPending ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(req.ma_yeu_cau)}
                            >
                              ✓ Duyệt
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setRejectModal(req.ma_yeu_cau)}
                            >
                              ✕ Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#5a7a72" }}>
                            {req.trang_thai === "da_tao" ? "✅ Đã xử lý" : "❌ Đã từ chối"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== MODAL TỪ CHỐI ===== */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">❌ Từ chối đề xuất</h3>
              <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>

            <p style={{ fontSize: 14, color: "#5a7a72", marginBottom: 12 }}>
              Vui lòng nhập lý do từ chối để đối tác biết và cải thiện.
            </p>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Lý do từ chối <span style={{ color: "#e05c5c" }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                border: "1px solid #d4ede6", borderRadius: 8,
                fontSize: 14, resize: "vertical",
                fontFamily: "inherit", boxSizing: "border-box",
                outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleRejectSubmit}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;