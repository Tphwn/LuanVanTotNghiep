import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  fetchUsers,
  lockUser,
  unlockUser,
} from "../../../store/slices/adminUserSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import { resolveUploadUrl } from "../../../utils/media";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import SummaryStats from "../../../components/common/management/SummaryStats";
import SearchBar from "../../../components/common/management/SearchBar";
import FilterTabs from "../../../components/common/management/FilterTabs";
import ToggleSwitch from "../../../components/common/management/ToggleSwitch";

const ROLE_LABEL = {
  khach_hang: "Khách hàng",
  doi_tac: "Đối tác",
};

const ROLE_BADGE = {
  khach_hang: "badge-info",
  doi_tac: "badge-success",
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
  khach_hang: (u) => u.vai_tro === "khach_hang",
  doi_tac: (u) => u.vai_tro === "doi_tac",
  bi_khoa: (u) => u.trang_thai === "bi_khoa",
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.adminUsers);

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

  const nonAdminUsers = useMemo(
    () => users.filter((u) => u.vai_tro !== "admin"),
    [users],
  );

  const stats = useMemo(() => ({
    total: nonAdminUsers.length,
    khachHang: nonAdminUsers.filter((u) => u.vai_tro === "khach_hang").length,
    doiTac: nonAdminUsers.filter((u) => u.vai_tro === "doi_tac").length,
    biKhoa: nonAdminUsers.filter((u) => u.trang_thai === "bi_khoa").length,
  }), [nonAdminUsers]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "khach_hang", label: "Khách hàng", count: stats.khachHang },
    { id: "doi_tac", label: "Đối tác", count: stats.doiTac },
    { id: "bi_khoa", label: "Bị khóa", count: stats.biKhoa },
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

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản khách hàng và đối tác trên hệ thống"
      />

      <SummaryStats
        items={[
          { label: "Tổng", value: stats.total, color: "#1a2e28" },
          { label: "Khách hàng", value: stats.khachHang, color: "#0958d9" },
          { label: "Đối tác", value: stats.doiTac, color: "#3C7363" },
          { label: "Bị khóa", value: stats.biKhoa, color: "#c0392b" },
        ]}
      />

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
        />
      </div>

      <FilterTabs tabs={filterTabs} active={activeTab} onChange={setActiveTab} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy người dùng phù hợp</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <colgroup>
                <col style={{ width: 52 }} />
                <col />
                <col />
                <col style={{ width: 110 }} />
                <col className="mgmt-col-type" />
                <col style={{ width: 100 }} />
                <col className="mgmt-col-toggle" />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th />
                  <th>Họ tên / Công ty</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const name = getDisplayName(user);
                  const avatar = getAvatar(user);
                  const isActive = user.trang_thai === "hoat_dong";
                  return (
                    <tr key={user.ma_nguoi_dung}>
                      <td>
                        <div className="mgmt-avatar">
                          {avatar ? (
                            <img src={avatar} alt="" />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="mgmt-cell-name">{name}</div>
                        <div className="mgmt-cell-sub">#{user.ma_nguoi_dung}</div>
                      </td>
                      <td style={{ color: "#5a7a72", fontSize: 13 }}>{user.email}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{user.so_dien_thoai}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[user.vai_tro] || "badge-default"}`}>
                          {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "#5a7a72" }}>{formatDate(user.ngay_tao)}</td>
                      <td>
                        <ToggleSwitch
                          compact
                          checked={isActive}
                          onChange={() => handleToggleActive(user)}
                          labelOn="Hoạt động"
                          labelOff="Bị khóa"
                        />
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => navigate(`/admin/users/${user.ma_nguoi_dung}`)}
                        >
                          Chi tiết
                        </ActionButton>
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
