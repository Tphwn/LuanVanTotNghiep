import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAmenities, addAmenity, updateAmenity, removeAmenity,
  fetchRequests, approveRequest, rejectRequest,
} from "../../../store/slices/amenitySlice";
import {
  AMENITY_ICON_PRESETS, getAmenityIcon, AMENITY_ICON_MAP,
  suggestIconSlugFromName, resolveIconSlug,
} from "../../../utils/amenityIcons";

const inferLoaiDeXuat = (req) => {
  if (req.loai_de_xuat) return req.loai_de_xuat;
  const moTa = (req.mo_ta || '').toLowerCase();
  if (moTa.includes('loại phòng') || moTa.includes('loai phong')) return 'phong';
  if (moTa.includes('khách sạn') || moTa.includes('khach san')) return 'khach_san';
  return null;
};

const AmenityIcon = ({ value, name = '', size = 28 }) => (
  <span
    title={name || value || "Tiện nghi"}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size + 12, height: size + 12, borderRadius: 10,
      background: "#f0f7f5", fontSize: size * 0.75, flexShrink: 0,
    }}
  >
    {getAmenityIcon(value, name)}
  </span>
);

const LOAI_LABEL = {
  khach_san: { label: "Khách sạn", cls: "badge-info", icon: "🏨" },
  phong:     { label: "Loại phòng", cls: "badge-success", icon: "🛏️" },
  ca_hai:    { label: "Cả hai", cls: "badge-warning", icon: "🔗" },
};

const REQUEST_STATUS = {
  cho_xu_ly: { label: "Chờ xử lý", cls: "badge-warning" },
  da_tao:    { label: "Đã tạo", cls: "badge-success" },
  tu_choi:   { label: "Từ chối", cls: "badge-danger" },
};

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {}
  );

  const [activeTab, setActiveTab] = useState("hotel");
  const [form, setForm] = useState({ ten: "", bieu_tuong: "wifi", loai: "khach_san" });
  const [editId, setEditId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModal, setApproveModal] = useState(null);
  const [approveForm, setApproveForm] = useState({ loai: "ca_hai", bieu_tuong: "wifi" });
  const [iconManual, setIconManual] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [requestFilter, setRequestFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchRequests());
  }, [dispatch]);

  const pendingCount = requests.filter((r) => r.trang_thai === "cho_xu_ly").length;

  const hotelAmenities = useMemo(
    () => list.filter((item) => item.loai === "khach_san" || item.loai === "ca_hai"),
    [list]
  );
  const roomAmenities = useMemo(
    () => list.filter((item) => item.loai === "phong" || item.loai === "ca_hai"),
    [list]
  );

  const currentLoai = activeTab === "hotel" ? "khach_san" : activeTab === "room" ? "phong" : null;
  const baseList = activeTab === "hotel" ? hotelAmenities : activeTab === "room" ? roomAmenities : [];

  const filteredList = baseList.filter((item) =>
    item.ten?.toLowerCase().includes(keyword.toLowerCase())
  );

  const filteredRequests = requests.filter((req) => {
    if (requestFilter === "all") return true;
    return req.trang_thai === requestFilter;
  });

  const resetForm = (loai) => {
    setForm({ ten: "", bieu_tuong: "wifi", loai: loai || currentLoai || "khach_san" });
    setEditId(null);
    setIconManual(false);
    setCustomEmoji("");
  };

  const handleNameChange = (ten) => {
    const next = { ...form, ten };
    if (!iconManual && !editId) {
      next.bieu_tuong = suggestIconSlugFromName(ten);
    }
    setForm(next);
  };

  const handleSubmit = () => {
    if (!form.ten.trim()) return alert("Vui lòng nhập tên tiện nghi");
    const iconSlug = customEmoji.trim() || resolveIconSlug(form.bieu_tuong, form.ten);
    const payload = {
      ...form,
      ten: form.ten.trim(),
      bieu_tuong: iconSlug,
    };
    if (editId) {
      dispatch(updateAmenity({ id: editId, data: payload }));
      setEditId(null);
    } else {
      dispatch(addAmenity(payload));
    }
    resetForm(currentLoai);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setKeyword("");
    if (tab === "hotel") resetForm("khach_san");
    else if (tab === "room") resetForm("phong");
  };

  const handleEdit = (item) => {
    setEditId(item.ma_tien_nghi);
    setForm({ ten: item.ten, bieu_tuong: item.bieu_tuong || suggestIconSlugFromName(item.ten), loai: item.loai });
    setIconManual(true);
    setCustomEmoji(/^\p{Extended_Pictographic}/u.test(item.bieu_tuong || '') ? item.bieu_tuong : '');
    setActiveTab(item.loai === "phong" ? "room" : "hotel");
  };

  const handleDelete = (id) => {
    if (window.confirm("Xóa tiện nghi này?")) dispatch(removeAmenity(id));
  };

  const openApprove = (req) => {
    const loai = inferLoaiDeXuat(req) || 'ca_hai';
    const icon = suggestIconSlugFromName(req.ten_de_xuat);
    setApproveModal(req);
    setApproveForm({ loai, bieu_tuong: icon });
    setCustomEmoji('');
  };

  const handleApproveSubmit = () => {
    if (!approveModal) return;
    const bieu_tuong = customEmoji.trim() || resolveIconSlug(approveForm.bieu_tuong, approveModal.ten_de_xuat);
    dispatch(approveRequest({
      id: approveModal.ma_yeu_cau,
      loai: approveForm.loai,
      bieu_tuong,
    })).then(() => {
      dispatch(fetchAmenities());
      dispatch(fetchRequests());
      setApproveModal(null);
      setCustomEmoji('');
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");
    dispatch(rejectRequest({ id: rejectModal, phan_hoi: rejectReason })).then(() => {
      dispatch(fetchRequests());
      setRejectModal(null);
      setRejectReason("");
    });
  };

  const renderAmenityTable = (items, emptyIcon, emptyText) => (
    <div className="content-card">
      <div className="content-card-header">
        <h3 className="content-card-title">Danh sách ({items.length})</h3>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#5a7a72" }}>⏳ Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{emptyIcon}</div>
          <p className="empty-state-text">{emptyText}</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Icon</th>
              <th>Tên tiện nghi</th>
              <th>Mã slug</th>
              <th>Phạm vi</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const loai = LOAI_LABEL[item.loai] || { label: item.loai, cls: "badge-default", icon: "🛎️" };
              return (
                <tr key={item.ma_tien_nghi}>
                  <td><AmenityIcon value={item.bieu_tuong} name={item.ten} /></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1a2e28" }}>{item.ten}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>#{item.ma_tien_nghi}</div>
                  </td>
                  <td style={{ color: "#5a7a72", fontSize: 13, fontFamily: "monospace" }}>
                    {item.bieu_tuong || "—"}
                  </td>
                  <td>
                    <span className={`badge ${loai.cls}`}>
                      {loai.icon} {loai.label}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>
                        ✏️ Sửa
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.ma_tien_nghi)}>
                        🗑️
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
  );

  const renderForm = () => (
    <div className="content-card" style={{ marginBottom: 16 }}>
      <h3 className="content-card-title" style={{ marginBottom: 14 }}>
        {editId ? "✏️ Chỉnh sửa tiện nghi" : "➕ Thêm tiện nghi mới"}
        <span style={{ fontSize: 13, fontWeight: 400, color: "#5a7a72", marginLeft: 8 }}>
          — {activeTab === "hotel" ? "Dùng cho khách sạn" : "Dùng cho loại phòng"}
        </span>
      </h3>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "2 1 200px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
            Tên tiện nghi <span style={{ color: "#e05c5c" }}>*</span>
          </label>
          <input
            className="search-input"
            style={{ width: "100%" }}
            placeholder={activeTab === "hotel" ? "VD: Hồ bơi, Bãi đỗ xe..." : "VD: Tủ lạnh, Ban công..."}
            value={form.ten}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
            Phạm vi áp dụng
          </label>
          <select
            className="search-input"
            style={{ width: "100%" }}
            value={form.loai}
            onChange={(e) => setForm({ ...form, loai: e.target.value })}
          >
            <option value={activeTab === "hotel" ? "khach_san" : "phong"}>
              Chỉ {activeTab === "hotel" ? "khách sạn" : "loại phòng"}
            </option>
            <option value="ca_hai">Cả hai (khách sạn & loại phòng)</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {editId ? "Cập nhật" : "Thêm mới"}
          </button>
          {editId && (
            <button type="button" className="btn btn-ghost" onClick={() => resetForm(currentLoai)}>
              Hủy
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
          Chọn icon hiển thị
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AMENITY_ICON_PRESETS.map((preset) => {
            const selected = form.bieu_tuong === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  setIconManual(true);
                  setForm({ ...form, bieu_tuong: preset.key });
                  setCustomEmoji('');
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                  border: selected ? "2px solid #3C7363" : "1px solid #d4ede6",
                  background: selected ? "#e8f5f1" : "#fff",
                  fontSize: 13, color: "#1a2e28",
                }}
              >
                <span style={{ fontSize: 18 }}>{AMENITY_ICON_MAP[preset.key]}</span>
                {preset.label}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <AmenityIcon value={customEmoji || form.bieu_tuong} name={form.ten} size={24} />
          <span style={{ fontSize: 13, color: "#5a7a72" }}>
            Xem trước: <strong>{form.ten || "Tên tiện nghi"}</strong>
            {!iconManual && form.ten && (
              <span style={{ marginLeft: 6, color: "#888" }}>(tự gợi ý từ tên)</span>
            )}
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
            Hoặc nhập emoji tùy chỉnh
          </label>
          <input
            className="search-input"
            style={{ width: 120, fontSize: 20, textAlign: "center" }}
            placeholder="🛎️"
            maxLength={4}
            value={customEmoji}
            onChange={(e) => {
              setCustomEmoji(e.target.value);
              setIconManual(true);
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tiện nghi</h1>
          <p className="page-subtitle">
            Quản lý tiện nghi khách sạn, loại phòng và xử lý đề xuất từ đối tác
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { label: "Tiện nghi KS", value: hotelAmenities.length, color: "#0958d9", icon: "🏨" },
          { label: "Tiện nghi phòng", value: roomAmenities.length, color: "#3C7363", icon: "🛏️" },
          { label: "Đề xuất từ ĐT", value: requests.length, color: "#7c3aed", icon: "📬" },
          { label: "Chờ xử lý", value: pendingCount, color: "#b36b00", icon: "⏳" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.icon} {s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs chính */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "hotel", label: "🏨 Tiện nghi Khách sạn", count: hotelAmenities.length },
          { id: "room", label: "🛏️ Tiện nghi Loại phòng", count: roomAmenities.length },
          { id: "requests", label: "📬 Đề xuất từ đối tác", count: pendingCount, badge: pendingCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => handleTabChange(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {tab.label}
            {tab.badge > 0 ? (
              <span style={{
                background: "#e05c5c", color: "#fff", borderRadius: 12,
                padding: "1px 7px", fontSize: 11, fontWeight: 700,
              }}>
                {tab.badge}
              </span>
            ) : (
              <span style={{ opacity: 0.7, fontSize: 12 }}>({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Khách sạn / Loại phòng */}
      {(activeTab === "hotel" || activeTab === "room") && (
        <>
          <div style={{
            padding: "12px 16px", background: activeTab === "hotel" ? "#e6f4ff" : "#e8f5f1",
            borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#334155",
            border: `1px solid ${activeTab === "hotel" ? "#91caff" : "#8FD9C4"}`,
          }}>
            {activeTab === "hotel" ? (
              <>🏨 <strong>Tiện nghi khách sạn</strong> — áp dụng cho toàn bộ cơ sở (hồ bơi, bãi đỗ xe, nhà hàng...). Đối tác chọn khi tạo/sửa khách sạn.</>
            ) : (
              <>🛏️ <strong>Tiện nghi loại phòng</strong> — áp dụng riêng từng loại phòng (tủ lạnh, ban công, bồn tắm...). Đối tác chọn khi tạo/sửa loại phòng.</>
            )}
          </div>

          {renderForm()}

          <div className="search-bar" style={{ marginBottom: 12 }}>
            <input
              className="search-input"
              placeholder="🔍 Tìm tên tiện nghi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {renderAmenityTable(
            filteredList,
            activeTab === "hotel" ? "🏨" : "🛏️",
            `Chưa có tiện nghi ${activeTab === "hotel" ? "khách sạn" : "loại phòng"} nào`
          )}
        </>
      )}

      {/* Tab Đề xuất */}
      {activeTab === "requests" && (
        <>
          <div style={{
            padding: "12px 16px", background: "#fff8e6", borderRadius: 10,
            marginBottom: 16, fontSize: 13, color: "#334155",
            border: "1px solid #ffe58f",
          }}>
            📬 Đối tác gửi đề xuất khi không tìm thấy tiện nghi phù hợp. Admin duyệt để tạo tiện nghi mới hoặc từ chối kèm lý do.
          </div>

          <div className="search-bar" style={{ marginBottom: 12 }}>
            <select
              className="search-input"
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              style={{ flex: "0 0 200px" }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="cho_xu_ly">Chờ xử lý</option>
              <option value="da_tao">Đã tạo</option>
              <option value="tu_choi">Từ chối</option>
            </select>
            {pendingCount > 0 && (
              <span className="badge badge-warning">{pendingCount} yêu cầu chờ duyệt</span>
            )}
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách đề xuất ({filteredRequests.length})</h3>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-text">Chưa có đề xuất nào từ đối tác</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đối tác</th>
                    <th>Loại đề xuất</th>
                    <th>Tên đề xuất</th>
                    <th>Mô tả</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                    <th>Phản hồi</th>
                    <th style={{ textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const st = REQUEST_STATUS[req.trang_thai] || { label: req.trang_thai, cls: "badge-default" };
                    const isPending = req.trang_thai === "cho_xu_ly";
                    const loaiDx = inferLoaiDeXuat(req);
                    const loaiInfo = loaiDx ? LOAI_LABEL[loaiDx] : { label: "Chưa rõ", cls: "badge-default", icon: "❓" };
                    const iconSlug = suggestIconSlugFromName(req.ten_de_xuat);
                    return (
                      <tr key={req.ma_yeu_cau}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{req.doi_tac?.ten_cong_ty || "—"}</div>
                          <div style={{ fontSize: 12, color: "#5a7a72" }}>{req.doi_tac?.email || "—"}</div>
                        </td>
                        <td>
                          <span className={`badge ${loaiInfo.cls}`}>
                            {loaiInfo.icon} {loaiInfo.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <AmenityIcon value={iconSlug} name={req.ten_de_xuat} size={22} />
                            <span style={{ fontWeight: 500 }}>{req.ten_de_xuat}</span>
                          </div>
                        </td>
                        <td style={{ color: "#5a7a72", fontSize: 13, maxWidth: 200 }}>
                          {req.mo_ta || "—"}
                        </td>
                        <td style={{ color: "#5a7a72", fontSize: 13 }}>
                          {new Date(req.ngay_yeu_cau).toLocaleString("vi-VN")}
                        </td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td style={{ fontSize: 13, color: "#5a7a72", maxWidth: 180 }}>
                          {req.phan_hoi || (req.tien_nghi ? `→ ${req.tien_nghi.ten}` : "—")}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isPending ? (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => openApprove(req)}>
                                ✓ Duyệt
                              </button>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => setRejectModal(req.ma_yeu_cau)}>
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
        </>
      )}

      {/* Modal duyệt */}
      {approveModal && (
        <div className="modal-overlay" onClick={() => setApproveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✓ Duyệt đề xuất tiện nghi</h3>
              <button type="button" className="modal-close" onClick={() => setApproveModal(null)}>×</button>
            </div>

            <p style={{ fontSize: 14, color: "#5a7a72", marginBottom: 16 }}>
              Tạo tiện nghi mới từ đề xuất: <strong>{approveModal.ten_de_xuat}</strong>
              <br />
              <span style={{ fontSize: 13 }}>Đối tác: {approveModal.doi_tac?.ten_cong_ty}</span>
              {inferLoaiDeXuat(approveModal) && (
                <span style={{ marginLeft: 8 }} className={`badge ${LOAI_LABEL[inferLoaiDeXuat(approveModal)]?.cls}`}>
                  {LOAI_LABEL[inferLoaiDeXuat(approveModal)]?.icon} Đề xuất cho {LOAI_LABEL[inferLoaiDeXuat(approveModal)]?.label}
                </span>
              )}
            </p>

            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <AmenityIcon
                value={customEmoji || approveForm.bieu_tuong}
                name={approveModal.ten_de_xuat}
                size={28}
              />
              <span style={{ fontSize: 13, color: "#5a7a72" }}>Icon gợi ý từ tên đề xuất</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Phạm vi áp dụng</label>
              <select
                className="search-input"
                style={{ width: "100%" }}
                value={approveForm.loai}
                onChange={(e) => setApproveForm({ ...approveForm, loai: e.target.value })}
              >
                <option value="khach_san">Chỉ khách sạn</option>
                <option value="phong">Chỉ loại phòng</option>
                <option value="ca_hai">Cả hai</option>
              </select>
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Chọn icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {AMENITY_ICON_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setApproveForm({ ...approveForm, bieu_tuong: preset.key });
                    setCustomEmoji('');
                  }}
                  style={{
                    padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                    border: approveForm.bieu_tuong === preset.key && !customEmoji ? "2px solid #3C7363" : "1px solid #d4ede6",
                    background: approveForm.bieu_tuong === preset.key && !customEmoji ? "#e8f5f1" : "#fff",
                  }}
                  title={preset.label}
                >
                  {AMENITY_ICON_MAP[preset.key]}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Hoặc emoji tùy chỉnh
              </label>
              <input
                className="search-input"
                style={{ width: 120, fontSize: 20, textAlign: "center" }}
                placeholder="🛎️"
                maxLength={4}
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setApproveModal(null)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleApproveSubmit}>Xác nhận duyệt</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal từ chối */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">❌ Từ chối đề xuất</h3>
              <button type="button" className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>

            <p style={{ fontSize: 14, color: "#5a7a72", marginBottom: 12 }}>
              Vui lòng nhập lý do từ chối để đối tác biết.
            </p>

            <textarea
              rows={4}
              placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid #d4ede6",
                borderRadius: 8, fontSize: 14, resize: "vertical",
                fontFamily: "inherit", boxSizing: "border-box", outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setRejectModal(null)}>Hủy</button>
              <button type="button" className="btn btn-danger" onClick={handleRejectSubmit}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;
