import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, Lock, Unlock } from "lucide-react";
import {
  fetchUsers,
  lockUser,
  unlockUser,
  clearUserMsg,
} from "../../../store/slices/adminUserSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import { resolveUploadUrl } from "../../../utils/media";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import ManagementToolbar from "../../../components/common/management/ManagementToolbar";

const ROLE_LABEL = {
  khach_hang: "Khách hàng",
  doi_tac: "Đối tác",
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

const TAB_FILTER = {
  all: () => true,
  hoat_dong: (u) => u.trang_thai === "hoat_dong",
  bi_khoa: (u) => u.trang_thai === "bi_khoa",
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading, error, successMsg } = useSelector((state) => state.adminUsers);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearUserMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const nonAdminUsers = useMemo(
    () => users.filter((u) => u.vai_tro !== "admin"),
    [users],
  );

  const stats = useMemo(() => ({
    total: nonAdminUsers.length,
    hoatDong: nonAdminUsers.filter((u) => u.trang_thai === "hoat_dong").length,
    biKhoa: nonAdminUsers.filter((u) => u.trang_thai === "bi_khoa").length,
  }), [nonAdminUsers]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "hoat_dong", label: "Đang hoạt động", count: stats.hoatDong },
    { id: "bi_khoa", label: "Đã khóa", count: stats.biKhoa },
  ], [stats]);

  const filteredUsers = useMemo(() => {
    const tabFilter = TAB_FILTER[activeTab] || TAB_FILTER.all;
    const searchText = debouncedKeyword.toLowerCase().trim();
    return nonAdminUsers.filter((user) => {
      if (!tabFilter(user)) return false;
      if (!searchText) return true;
      const name = getDisplayName(user).toLowerCase();
      return (
        user.email.toLowerCase().includes(searchText)
        || user.so_dien_thoai.includes(searchText)
        || name.includes(searchText)
      );
    });
  }, [nonAdminUsers, activeTab, debouncedKeyword]);

  const handleToggleActive = (user) => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản "${getDisplayName(user)}" (${user.email})?`
      : `Mở khóa tài khoản "${getDisplayName(user)}"?`;
    if (!window.confirm(msg)) return;
    if (isActive) dispatch(lockUser(user.ma_nguoi_dung));
    else dispatch(unlockUser(user.ma_nguoi_dung));
  };

  const getStatusText = (status) => {
    if (status === "hoat_dong") return { label: "Đang hoạt động", cls: "mgmt-status-text--active" };
    if (status === "bi_khoa") return { label: "Đã khóa", cls: "mgmt-status-text--locked" };
    return { label: status, cls: "" };
  };

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Người Dùng"
        subtitle="Quản lý tài khoản khách hàng và đối tác trên hệ thống"
        actionLabel="Tạo tài khoản đối tác"
        onAction={() => {
          dispatch(clearUserMsg());
          navigate("/admin/users/create-partner");
        }}
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? "success" : "error"}`}>
          {successMsg || error}
        </div>
      )}

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên, email, SĐT..."
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy người dùng phù hợp</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th style={{ width: 120 }}>SĐT</th>
                  <th style={{ width: 110 }}>Vai trò</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 110 }}>Ngày tạo</th>
                  <th style={{ width: 110 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const name = getDisplayName(user);
                  const avatar = getAvatar(user);
                  const isActive = user.trang_thai === "hoat_dong";
                  const status = getStatusText(user.trang_thai);
                  return (
                    <tr key={user.ma_nguoi_dung}>
                      <td style={{ color: "#64748b", fontWeight: 500 }}>{user.ma_nguoi_dung}</td>
                      <td>
                        <div className="mgmt-name-cell">
                          <div className="mgmt-avatar-circle">
                            {avatar ? <img src={avatar} alt="" /> : getInitials(name)}
                          </div>
                          <span className="mgmt-cell-name">{name}</span>
                        </div>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 13 }}>{user.email}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{user.so_dien_thoai}</td>
                      <td style={{ fontSize: 13, color: "#475569" }}>
                        {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                      </td>
                      <td>
                        <span className={`mgmt-status-text ${status.cls}`}>{status.label}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "#64748b" }}>{formatDate(user.ngay_tao)}</td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => navigate(`/admin/users/${user.ma_nguoi_dung}`)}
                        />
                        <ActionButton
                          variant={isActive ? "lock" : "unlock"}
                          iconOnly
                          icon={isActive ? Lock : Unlock}
                          title={isActive ? "Khóa tài khoản" : "Mở khóa"}
                          onClick={() => handleToggleActive(user)}
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
  );
};

export default UsersPage;
