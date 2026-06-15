import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  lockUser,
  unlockUser,
} from "../../../redux/slices/adminUserSlice";
import { resolveUploadUrl } from "../../../utils/media";

const ROLE_LABEL = {
  khach_hang: "Khách hàng",
  doi_tac: "Đối tác",
};

const ROLE_BADGE = {
  khach_hang: "badge-info",
  doi_tac: "badge-success",
};

const STATUS_LABEL = {
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
};

const getPartner = (user) => user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;

const getDisplayName = (user) => {
  if (user.vai_tro === "khach_hang") return user.khach_hang?.ho_ten || "Chưa cập nhật";
  if (user.vai_tro === "doi_tac") return getPartner(user)?.ten_cong_ty || "Chưa cập nhật";
  return "Admin";
};

const getAvatar = (user) => {
  if (user.vai_tro === "khach_hang" && user.khach_hang?.anh_dai_dien) {
    return resolveUploadUrl(user.khach_hang.anh_dai_dien);
  }
  const partner = getPartner(user);
  if (partner?.anh_dai_dien) return resolveUploadUrl(partner.anh_dai_dien);
  return null;
};

const getInitials = (name) => {
  if (!name || name === "Chưa cập nhật") return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.adminUsers);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const nonAdminUsers = useMemo(
    () => users.filter((u) => u.vai_tro !== "admin"),
    [users],
  );

  const filteredUsers = useMemo(() => nonAdminUsers.filter((user) => {
    const matchRole = roleFilter === "all" || user.vai_tro === roleFilter;
    const matchStatus = statusFilter === "all" || user.trang_thai === statusFilter;
    const searchText = debouncedKeyword.toLowerCase().trim();
    if (!searchText) return matchRole && matchStatus;
    const name = getDisplayName(user).toLowerCase();
    const matchKeyword =
      user.email.toLowerCase().includes(searchText)
      || user.so_dien_thoai.includes(searchText)
      || name.includes(searchText);
    return matchRole && matchStatus && matchKeyword;
  }), [nonAdminUsers, roleFilter, statusFilter, debouncedKeyword]);

  const stats = useMemo(() => ({
    total: nonAdminUsers.length,
    khachHang: nonAdminUsers.filter((u) => u.vai_tro === "khach_hang").length,
    doiTac: nonAdminUsers.filter((u) => u.vai_tro === "doi_tac").length,
    biKhoa: nonAdminUsers.filter((u) => u.trang_thai === "bi_khoa").length,
  }), [nonAdminUsers]);

  const hasActiveFilter = roleFilter !== "all" || statusFilter !== "all" || keyword;

  const handleLockToggle = (user) => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản "${getDisplayName(user)}" (${user.email})?`
      : `Mở khóa tài khoản "${getDisplayName(user)}"?`;
    if (!window.confirm(msg)) return;
    if (isActive) dispatch(lockUser(user.ma_nguoi_dung));
    else dispatch(unlockUser(user.ma_nguoi_dung));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản khách hàng và đối tác trên hệ thống</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { label: "Tổng người dùng", value: stats.total, color: "#3C7363", icon: "👥" },
          { label: "Khách hàng", value: stats.khachHang, color: "#0958d9", icon: "🧳" },
          { label: "Đối tác", value: stats.doiTac, color: "#b36b00", icon: "🏢" },
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Tìm kiếm</label>
            <input
              type="text"
              className="search-input"
              style={{ width: "100%" }}
              placeholder="Tên, email, số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Vai trò</label>
            <select className="search-input" style={{ width: "100%" }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">Tất cả vai trò</option>
              <option value="khach_hang">Khách hàng</option>
              <option value="doi_tac">Đối tác</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Trạng thái</label>
            <select className="search-input" style={{ width: "100%" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="hoat_dong">Hoạt động</option>
              <option value="bi_khoa">Bị khóa</option>
            </select>
          </div>
          {hasActiveFilter && (
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: "100%" }}
                onClick={() => { setKeyword(""); setRoleFilter("all"); setStatusFilter("all"); }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách người dùng ({filteredUsers.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>⏳ Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-text">Không tìm thấy người dùng phù hợp</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }} />
                  <th>Mã</th>
                  <th>Họ tên / Công ty</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: "right", minWidth: 150 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const name = getDisplayName(user);
                  const avatar = getAvatar(user);
                  const st = STATUS_LABEL[user.trang_thai] || { label: user.trang_thai, cls: "badge-default" };
                  const isActive = user.trang_thai === "hoat_dong";
                  return (
                    <tr key={user.ma_nguoi_dung}>
                      <td>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", overflow: "hidden",
                          background: "#e8f5f1", border: "1px solid #d4ede6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#3C7363",
                        }}>
                          {avatar ? (
                            <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "#3C7363" }}>#{user.ma_nguoi_dung}</td>
                      <td style={{ fontWeight: 500 }}>{name}</td>
                      <td style={{ color: "#5a7a72", fontSize: 13 }}>{user.email}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{user.so_dien_thoai}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[user.vai_tro] || "badge-default"}`}>
                          {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                        </span>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ fontSize: 12, color: "#888" }}>{formatDate(user.ngay_tao)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/admin/users/${user.ma_nguoi_dung}`)}
                          >
                            👁️ Chi tiết
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? "btn-ghost" : "btn-success"}`}
                            onClick={() => handleLockToggle(user)}
                            title={isActive ? "Khóa" : "Mở khóa"}
                          >
                            {isActive ? "🔒" : "🔓"}
                          </button>
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

export default UsersPage;
