import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  lockUser,
  unlockUser,
} from "../../../redux/slices/adminUserSlice";

const ROLE_LABEL = {
  khach_hang: "Khách hàng",
  doi_tac: "Đối tác",
};

const ROLE_BADGE = {
  khach_hang: "badge badge-info",
  doi_tac: "badge badge-success",
};

const getDisplayName = (user) => {
  if (user.vai_tro === "khach_hang")
    return user.khach_hang?.ho_ten || "Chưa cập nhật";
  if (user.vai_tro === "doi_tac")
    return (
      user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung?.ten_cong_ty ||
      "Chưa cập nhật"
    );
  return "Admin";
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.adminUsers);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users
    .filter((u) => u.vai_tro !== "admin")
    .filter((user) => {
      const matchRole =
        roleFilter === "all" || user.vai_tro === roleFilter;
      const matchStatus =
        statusFilter === "all" || user.trang_thai === statusFilter;
      const searchText = keyword.toLowerCase();
      const name = getDisplayName(user).toLowerCase();
      const matchKeyword =
        user.email.toLowerCase().includes(searchText) ||
        user.so_dien_thoai.includes(searchText) ||
        name.includes(searchText);
      return matchRole && matchStatus && matchKeyword;
    });

  const handleLockToggle = (user) => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản ${user.email}?`
      : `Mở khóa tài khoản ${user.email}?`;
    if (!window.confirm(msg)) return;
    if (isActive) dispatch(lockUser(user.ma_nguoi_dung));
    else dispatch(unlockUser(user.ma_nguoi_dung));
  };

  const totalKH = users.filter((u) => u.vai_tro === "khach_hang").length;
  const totalDT = users.filter((u) => u.vai_tro === "doi_tac").length;
  const totalLocked = users.filter(
    (u) => u.vai_tro !== "admin" && u.trang_thai === "bi_khoa"
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">
            Quản lý tất cả tài khoản khách hàng và đối tác trong hệ thống
          </p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}
      >
        <div className="stat-card" style={{ borderTop: "3px solid #3C7363" }}>
          <div className="stat-card-label">Tổng người dùng</div>
          <div className="stat-card-value" style={{ color: "#3C7363" }}>
            {totalKH + totalDT}
          </div>
          <div className="stat-card-sub">Không tính admin</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #0958d9" }}>
          <div className="stat-card-label">Khách hàng</div>
          <div className="stat-card-value" style={{ color: "#0958d9" }}>
            {totalKH}
          </div>
          <div className="stat-card-sub">Tài khoản đặt phòng</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #b36b00" }}>
          <div className="stat-card-label">Đối tác</div>
          <div className="stat-card-value" style={{ color: "#b36b00" }}>
            {totalDT}
          </div>
          <div className="stat-card-sub">Chủ khách sạn</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #e05c5c" }}>
          <div className="stat-card-label">Bị khóa</div>
          <div className="stat-card-value" style={{ color: "#e05c5c" }}>
            {totalLocked}
          </div>
          <div className="stat-card-sub">Tài khoản bị khóa</div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍  Tìm theo tên, email, số điện thoại..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="search-input"
          style={{ flex: 2 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="search-input"
          style={{ flex: 1 }}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="khach_hang">Khách hàng</option>
          <option value="doi_tac">Đối tác</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="search-input"
          style={{ flex: 1 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="hoat_dong">Hoạt động</option>
          <option value="bi_khoa">Bị khóa</option>
        </select>
      </div>

      {/* Bảng danh sách */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            Danh sách người dùng ({filteredUsers.length})
          </h3>
        </div>

        {loading ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#5a7a72" }}
          >
            ⏳ Đang tải dữ liệu...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-text">Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Họ tên / Công ty</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.ma_nguoi_dung}>
                  <td style={{ color: "#5a7a72", fontWeight: 500 }}>
                    #{user.ma_nguoi_dung}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {getDisplayName(user)}
                  </td>
                  <td style={{ color: "#5a7a72" }}>{user.email}</td>
                  <td>{user.so_dien_thoai}</td>
                  <td>
                    <span
                      className={
                        ROLE_BADGE[user.vai_tro] || "badge badge-default"
                      }
                    >
                      {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        user.trang_thai === "hoat_dong"
                          ? "badge-success"
                          : "badge-danger"
                      }`}
                    >
                      {user.trang_thai === "hoat_dong"
                        ? "● Hoạt động"
                        : "● Bị khóa"}
                    </span>
                  </td>
                  <td style={{ color: "#5a7a72", fontSize: 13 }}>
                    {new Date(user.ngay_tao).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          navigate(`/admin/users/${user.ma_nguoi_dung}`)
                        }
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className={`btn btn-sm ${
                          user.trang_thai === "hoat_dong"
                            ? "btn-danger"
                            : "btn-outline"
                        }`}
                        onClick={() => handleLockToggle(user)}
                      >
                        {user.trang_thai === "hoat_dong" ? "Khóa" : "Mở khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;