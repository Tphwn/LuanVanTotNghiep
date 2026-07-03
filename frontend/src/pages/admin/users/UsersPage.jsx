import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Lock, Unlock } from "lucide-react";
import {
  fetchUsers,
  lockUser,
  unlockUser,
  clearUserMsg,
} from "../../../store/slices/adminUserSlice";
import { fetchHotels } from "../../../store/slices/adminHotelSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import { resolveUploadUrl } from "../../../utils/media";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import ManagementToolbar from "../../../components/common/management/ManagementToolbar";

const PAGE_SIZE = 10;

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

const TAB_FILTER = {
  all: () => true,
  hoat_dong: (u) => u.trang_thai === "hoat_dong",
  bi_khoa: (u) => u.trang_thai === "bi_khoa",
};

const ROLE_FILTER = {
  all: () => true,
  khach_hang: (u) => u.vai_tro === "khach_hang",
  doi_tac: (u) => u.vai_tro === "doi_tac",
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users = [], loading, error, successMsg } = useSelector((state) => state.adminUsers);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

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

  useEffect(() => {
    setPage(1);
  }, [activeTab, roleFilter, debouncedKeyword]);

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
    const roleFn = ROLE_FILTER[roleFilter] || ROLE_FILTER.all;
    const searchText = debouncedKeyword.toLowerCase().trim();
    return nonAdminUsers.filter((user) => {
      if (!tabFilter(user)) return false;
      if (!roleFn(user)) return false;
      if (!searchText) return true;
      const name = getDisplayName(user).toLowerCase();
      return (
        user.email.toLowerCase().includes(searchText)
        || (user.so_dien_thoai || "").includes(searchText)
        || name.includes(searchText)
      );
    });
  }, [nonAdminUsers, activeTab, roleFilter, debouncedKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const handleToggleActive = async (user) => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản "${getDisplayName(user)}" (${user.email})?`
      : `Mở khóa tài khoản "${getDisplayName(user)}"?`;
    if (!window.confirm(msg)) return;

    setToggleLoadingId(user.ma_nguoi_dung);
    const thunk = isActive ? lockUser(user.ma_nguoi_dung) : unlockUser(user.ma_nguoi_dung);
    const result = await dispatch(thunk);
    setToggleLoadingId(null);

    if (user.vai_tro === "doi_tac") {
      if (lockUser.fulfilled.match(result) || unlockUser.fulfilled.match(result)) {
        dispatch(fetchHotels());
      }
    }
  };

  const getStatusText = (status) => {
    if (status === "hoat_dong") return { label: "Đang hoạt động", cls: "mgmt-status-text--active" };
    if (status === "bi_khoa") return { label: "Đã khóa", cls: "mgmt-status-text--locked" };
    return { label: status, cls: "" };
  };

  const rangeFrom = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  return (
    <div className="mgmt-page mgmt-list-page">
      <ManagementHeader
        title="Quản Lý Người Dùng"
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
      >
        <select
          className="mgmt-select-inline"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Lọc theo vai trò"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="khach_hang">Khách hàng</option>
          <option value="doi_tac">Đối tác</option>
        </select>
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy người dùng phù hợp</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid mgmt-list-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Mã</th>
                    <th>Họ Tên</th>
                    <th>Email</th>
                    <th style={{ width: 130 }}>SĐT</th>
                    <th style={{ width: 120 }}>Vai Trò</th>
                    <th style={{ width: 140 }}>Trạng Thái</th>
                    <th style={{ width: 100 }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => {
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
                        <td style={{ whiteSpace: "nowrap" }}>{user.so_dien_thoai || "—"}</td>
                        <td style={{ fontSize: 13, color: "#475569" }}>
                          {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                        </td>
                        <td>
                          <span className={`mgmt-status-text ${status.cls}`}>{status.label}</span>
                        </td>
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
                            disabled={toggleLoadingId === user.ma_nguoi_dung}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length > PAGE_SIZE && (
              <div className="mgmt-list-pagination">
                <span className="mgmt-list-pagination-info">
                  Hiển thị {rangeFrom}–{rangeTo} / {filteredUsers.length}
                </span>
                <div className="mgmt-list-pagination-controls">
                  <button
                    type="button"
                    className="mgmt-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`mgmt-page-btn${num === currentPage ? " is-active" : ""}`}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mgmt-page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
