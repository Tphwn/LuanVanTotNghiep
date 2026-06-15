import { useEffect, useState } from "react";
import api from "../../../services/api";

const REPORT_STATUS = {
  cho_xu_ly:    { label: "Chờ xử lý", cls: "badge-warning" },
  da_chap_nhan: { label: "Đã chấp nhận", cls: "badge-success" },
  tu_choi:      { label: "Từ chối", cls: "badge-danger" },
};

const REPORT_TYPE = {
  khach_san: { label: "Khách sạn", icon: "🏨", color: "#0958d9" },
  dat_phong: { label: "Đặt phòng", icon: "📋", color: "#3C7363" },
  dich_vu:   { label: "Dịch vụ", icon: "🛎️", color: "#7c3aed" },
  lua_dao:   { label: "Lừa đảo", icon: "⚠️", color: "#e05c5c" },
  khac:      { label: "Khác", icon: "📌", color: "#888" },
};

const TIME_PRESETS = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "7", label: "7 ngày qua" },
  { value: "30", label: "30 ngày qua" },
  { value: "90", label: "90 ngày qua" },
  { value: "custom", label: "Tùy chọn" },
];

const getDateRange = (preset, customFrom, customTo) => {
  if (preset === "all") return {};
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

const truncate = (text, len = 50) => {
  if (!text) return "—";
  return text.length > len ? `${text.slice(0, len)}...` : text;
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f0f4f3", fontSize: 14 }}>
    <span style={{ width: 140, color: "#5a7a72", flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: "#1a2e28", fontWeight: 500 }}>{value ?? "—"}</span>
  </div>
);

const TypeBadge = ({ type }) => {
  const t = REPORT_TYPE[type] || REPORT_TYPE.khac;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
      background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}33`,
    }}>
      {t.icon} {t.label}
    </span>
  );
};

const DetailModal = ({ report, onClose, onAccept, onReject, actionLoading }) => {
  const [note, setNote] = useState("");
  if (!report) return null;

  const st = REPORT_STATUS[report.trang_thai] || { label: report.trang_thai, cls: "badge-default" };
  const isPending = report.trang_thai === "cho_xu_ly";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Chi tiết báo cáo #{report.ma_bao_cao}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <TypeBadge type={report.loai_bao_cao} />
        </div>

        <div className="content-card" style={{ padding: "14px 16px", marginBottom: 14, background: "#f8fdfb" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#3C7363" }}>Thông tin báo cáo</h4>
          <InfoRow label="Tiêu đề" value={report.tieu_de} />
          <InfoRow label="Người báo cáo" value={report.khach_hang?.ho_ten} />
          <InfoRow label="Khách sạn" value={report.ten_khach_san} />
          <InfoRow label="Loại phòng" value={report.ten_loai_phong} />
          <InfoRow label="Mã đơn hàng" value={report.ma_don_hang} />
          <InfoRow label="Ngày gửi" value={formatDateTime(report.ngay_bao_cao)} />
          {report.ngay_xu_ly && <InfoRow label="Ngày xử lý" value={formatDateTime(report.ngay_xu_ly)} />}
          {report.admin_xu_ly && <InfoRow label="Admin xử lý" value={report.admin_xu_ly} />}
        </div>

        <div style={{ marginBottom: 14 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#3C7363" }}>Nội dung báo cáo</h4>
          <div style={{
            padding: "14px 16px", borderRadius: 10, border: "1px solid #e8f5f1",
            fontSize: 14, color: "#444", lineHeight: 1.7, background: "#fff",
          }}>
            {report.noi_dung}
          </div>
        </div>

        {report.minh_chung && (
          <div style={{ marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#3C7363" }}>Minh chứng</h4>
            <a href={report.minh_chung} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              📎 Xem minh chứng
            </a>
          </div>
        )}

        {report.phan_hoi_admin && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#3C7363" }}>Phản hồi admin</h4>
            <div style={{
              padding: "12px 14px", background: "#f0f7f5", borderRadius: 8,
              borderLeft: "3px solid #3C7363", fontSize: 14, color: "#444",
            }}>
              {report.phan_hoi_admin}
            </div>
          </div>
        )}

        {isPending && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#1a2e28" }}>
              Ghi chú xử lý (bắt buộc khi từ chối)
            </label>
            <textarea
              className="search-input"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
              placeholder="Nhập phản hồi gửi đến người báo cáo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {isPending && (
            <>
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={actionLoading}
                onClick={() => onAccept(report, note)}
              >
                {actionLoading ? "⏳..." : "✅ Chấp nhận"}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: "#e05c5c", color: "#fff", border: "none" }}
                disabled={actionLoading}
                onClick={() => onReject(report, note)}
              >
                {actionLoading ? "⏳..." : "❌ Từ chối"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [toast, setToast] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timePreset, setTimePreset] = useState("all");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDashboard = async () => {
    try {
      const res = await api.get("/admin/reports/dashboard");
      setDashboard(res.data.data);
    } catch {
      setDashboard(null);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = { ...getDateRange(timePreset, tuNgay, denNgay) };
      if (statusFilter !== "all") params.trang_thai = statusFilter;
      if (typeFilter !== "all") params.loai_bao_cao = typeFilter;
      const res = await api.get("/admin/reports", { params });
      setReports(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tải báo cáo", "error");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "manage") loadReports();
  }, [activeTab, statusFilter, typeFilter, timePreset, tuNgay, denNgay]);

  const refreshAll = async () => {
    await loadDashboard();
    if (activeTab === "manage") await loadReports();
  };

  const handleAccept = async (report, note) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/reports/${report.ma_bao_cao}/accept`, {
        phan_hoi_admin: note || undefined,
      });
      showToast(res.data.message);
      setDetailReport(res.data.data);
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (report, note) => {
    if (!note?.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/reports/${report.ma_bao_cao}/reject`, {
        phan_hoi_admin: note,
      });
      showToast(res.data.message);
      setDetailReport(res.data.data);
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilter = statusFilter !== "all" || typeFilter !== "all" || timePreset !== "all";
  const dash = dashboard || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý báo cáo</h1>
          <p className="page-subtitle">Theo dõi và xử lý báo cáo, khiếu nại từ khách hàng</p>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.type === "success" ? "#e8f5f1" : "#fff0f0",
          border: `1px solid ${toast.type === "success" ? "#8FD9C4" : "#ffb3b3"}`,
          color: toast.type === "success" ? "#3C7363" : "#e05c5c",
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "dashboard", label: "📊 Tổng quan" },
          { id: "manage", label: "📋 Quản lý báo cáo" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "manage" && dash.cho_xu_ly > 0 && (
              <span style={{
                marginLeft: 6, background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "#fff3e0",
                color: activeTab === tab.id ? "#fff" : "#b36b00",
                borderRadius: 10, padding: "1px 7px", fontSize: 11,
              }}>
                {dash.cho_xu_ly}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            {[
              { label: "Tổng báo cáo", value: dash.tong_bao_cao ?? 0, color: "#3C7363", icon: "📋" },
              { label: "Chờ xử lý", value: dash.cho_xu_ly ?? 0, color: "#b36b00", icon: "⏳" },
              { label: "Đã chấp nhận", value: dash.da_chap_nhan ?? 0, color: "#52c41a", icon: "✅" },
              { label: "Từ chối", value: dash.tu_choi ?? 0, color: "#e05c5c", icon: "❌" },
              { label: "30 ngày qua", value: dash.moi_30_ngay ?? 0, color: "#0958d9", icon: "📅" },
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="content-card">
              <h3 className="content-card-title" style={{ marginBottom: 14 }}>Phân loại báo cáo</h3>
              {(dash.theo_loai || []).length === 0 ? (
                <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>Chưa có dữ liệu</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(dash.theo_loai || []).map((item) => {
                    const t = REPORT_TYPE[item.loai_bao_cao] || REPORT_TYPE.khac;
                    const pct = dash.tong_bao_cao
                      ? Math.round((item.so_luong / dash.tong_bao_cao) * 100) : 0;
                    return (
                      <div key={item.loai_bao_cao}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                          <span>{t.icon} {t.label}</span>
                          <strong style={{ color: t.color }}>{item.so_luong} ({pct}%)</strong>
                        </div>
                        <div style={{ height: 8, background: "#e8f5f1", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: t.color, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="content-card">
              <div className="content-card-header">
                <h3 className="content-card-title">Báo cáo gần đây</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab("manage")}>
                  Xem tất cả →
                </button>
              </div>
              {(dash.gan_day || []).length === 0 ? (
                <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>Chưa có báo cáo</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(dash.gan_day || []).map((r) => {
                    const st = REPORT_STATUS[r.trang_thai] || { label: r.trang_thai, cls: "badge-default" };
                    return (
                      <div
                        key={r.ma_bao_cao}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setActiveTab("manage"); setDetailReport(r); }}
                        onKeyDown={(e) => e.key === "Enter" && setDetailReport(r)}
                        style={{
                          padding: "12px 14px", borderRadius: 10, border: "1px solid #e8f5f1",
                          cursor: "pointer", transition: "background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>#{r.ma_bao_cao} · {r.tieu_de}</span>
                          <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {r.khach_hang?.ho_ten} · {formatDate(r.ngay_bao_cao)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Manage */}
      {activeTab === "manage" && (
        <>
          <div className="content-card" style={{ marginBottom: 16, padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Trạng thái</label>
                <select className="search-input" style={{ width: "100%" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="cho_xu_ly">Chờ xử lý</option>
                  <option value="da_chap_nhan">Đã chấp nhận</option>
                  <option value="tu_choi">Từ chối</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Loại báo cáo</label>
                <select className="search-input" style={{ width: "100%" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tất cả loại</option>
                  {Object.entries(REPORT_TYPE).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Thời gian</label>
                <select className="search-input" style={{ width: "100%" }} value={timePreset} onChange={(e) => setTimePreset(e.target.value)}>
                  {TIME_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {timePreset === "custom" && (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: "#5a7a72", display: "block", marginBottom: 6 }}>Từ ngày</label>
                    <input type="date" className="search-input" style={{ width: "100%" }} value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#5a7a72", display: "block", marginBottom: 6 }}>Đến ngày</label>
                    <input type="date" className="search-input" style={{ width: "100%" }} value={denNgay} min={tuNgay} onChange={(e) => setDenNgay(e.target.value)} />
                  </div>
                </>
              )}
              {hasActiveFilter && (
                <div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
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

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Danh sách báo cáo ({reports.length})</h3>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>⏳ Đang tải...</div>
            ) : reports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">Không có báo cáo phù hợp bộ lọc</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tiêu đề</th>
                      <th>Người báo cáo</th>
                      <th>Loại</th>
                      <th>Khách sạn</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const st = REPORT_STATUS[r.trang_thai] || { label: r.trang_thai, cls: "badge-default" };
                      return (
                        <tr key={r.ma_bao_cao}>
                          <td style={{ fontWeight: 600, color: "#3C7363" }}>#{r.ma_bao_cao}</td>
                          <td>
                            <div style={{ fontWeight: 500, maxWidth: 180 }}>{truncate(r.tieu_de, 40)}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>{truncate(r.noi_dung, 35)}</div>
                          </td>
                          <td style={{ fontSize: 13 }}>{r.khach_hang?.ho_ten || "—"}</td>
                          <td><TypeBadge type={r.loai_bao_cao} /></td>
                          <td style={{ fontSize: 13 }}>{r.ten_khach_san || "—"}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(r.ngay_bao_cao)}</td>
                          <td style={{ textAlign: "right" }}>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetailReport(r)}>
                              👁️ Chi tiết
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
        </>
      )}

      {detailReport && (
        <DetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ReportsPage;
