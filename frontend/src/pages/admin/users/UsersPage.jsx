import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Lock, Unlock } from "lucide-react";
import {
  fetchUsers,
  lockUser,
  unlockUser,
  clearUserMsg,
} from "../../../store/slices/adminUserSlice";
import { fetchHotels } from "../../../store/slices/adminHotelSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import ManagementToolbar from "../../../components/common/management/ManagementToolbar";
import FilterActions from "../../../components/common/management/FilterActions";
import CreatePartnerModal from "./components/CreatePartnerModal";
import UserLockConfirmModal from "./components/UserLockConfirmModal";
import { ACCOUNT_BADGE } from "../../../constants/statusConfig";
import { buildAdminUsersListPath } from "../../../utils/adminListReturn";
import DownSelect from '../../../components/common/management/DownSelect';

const PAGE_SIZE = 10;
const VALID_STATUS_TABS = ["all", "hoat_dong", "bi_khoa"];

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

const getNameInitial = (name) => {
  if (!name || name === "Chưa cập nhật") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const word = parts[parts.length - 1] || parts[0];
  return word[0]?.toUpperCase() || "?";
};

const STATUS_FILTER = {
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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { users = [], loading, error, successMsg } = useSelector((state) => state.adminUsers);

  const [flashMsg, setFlashMsg] = useState(location.state?.toast || "");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabFromUrl = searchParams.get("tab");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    VALID_STATUS_TABS.includes(tabFromUrl) ? tabFromUrl : "all"
  );
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    const tab = searchParams.get("tab") || "all";
    if (VALID_STATUS_TABS.includes(tab) && tab !== statusFilter) {
      setStatusFilter(tab);
    }
  }, [searchParams, statusFilter]);

  useEffect(() => {
    if (!flashMsg) return undefined;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    const t = setTimeout(() => setFlashMsg(""), 4000);
    return () => clearTimeout(t);
  }, [flashMsg]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearUserMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, roleFilter, keyword]);

  const handleStatusTabChange = (tab) => {
    setStatusFilter(tab);
    if (tab === "all") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

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
    { id: "all", label: "Tất cả", count: stats.total, tone: "neutral" },
    { id: "hoat_dong", label: "Đang hoạt động", count: stats.hoatDong, tone: "success" },
    { id: "bi_khoa", label: "Đã khóa", count: stats.biKhoa, tone: "danger" },
  ], [stats]);

  const filteredUsers = useMemo(() => {
    const statusFn = STATUS_FILTER[statusFilter] || STATUS_FILTER.all;
    const roleFn = ROLE_FILTER[roleFilter] || ROLE_FILTER.all;
    const searchText = keyword.toLowerCase().trim();
    return nonAdminUsers.filter((user) => {
      if (!statusFn(user)) return false;
      if (!roleFn(user)) return false;
      if (!searchText) return true;
      const name = getDisplayName(user).toLowerCase();
      return (
        user.email.toLowerCase().includes(searchText)
        || (user.so_dien_thoai || "").includes(searchText)
        || name.includes(searchText)
      );
    });
  }, [nonAdminUsers, statusFilter, roleFilter, keyword]);

  const emptyListMessage = useMemo(() => {
    const hasExtraFilter = Boolean(keyword.trim()) || roleFilter !== "all";
    if (statusFilter === "bi_khoa") {
      return hasExtraFilter
        ? "Không tìm thấy người dùng bị khóa phù hợp"
        : "Danh sách người dùng bị khóa trống";
    }
    if (statusFilter === "hoat_dong") {
      return hasExtraFilter
        ? "Không tìm thấy người dùng đang hoạt động phù hợp"
        : "Danh sách người dùng đang hoạt động trống";
    }
    if (hasExtraFilter) return "Không tìm thấy người dùng phù hợp";
    return "Chưa có người dùng nào";
  }, [statusFilter, roleFilter, keyword]);

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

  const handleToggleActive = (user) => {
    const isActive = user.trang_thai === "hoat_dong";
    setConfirmAction({
      user: {
        ...user,
        displayName: getDisplayName(user),
      },
      action: isActive ? "lock" : "unlock",
    });
  };

  const handleCloseConfirm = () => {
    if (toggleLoadingId) return;
    setConfirmAction(null);
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;

    const { user, action } = confirmAction;
    const isLock = action === "lock";

    setToggleLoadingId(user.ma_nguoi_dung);
    const thunk = isLock ? lockUser(user.ma_nguoi_dung) : unlockUser(user.ma_nguoi_dung);
    const result = await dispatch(thunk);
    setToggleLoadingId(null);

    if (lockUser.fulfilled.match(result) || unlockUser.fulfilled.match(result)) {
      setConfirmAction(null);
      if (user.vai_tro === "doi_tac") {
        dispatch(fetchHotels());
      }
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setRoleFilter("all");
    setSearchParams({}, { replace: true });
  };

  const rangeFrom = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  return (
    <div className="mgmt-page mgmt-list-page admin-users-page">
      <ManagementHeader
        title="Quản Lý Người Dùng"
        actionLabel="Tạo tài khoản đối tác"
        onAction={() => {
          dispatch(clearUserMsg());
          setShowCreateModal(true);
        }}
      />

      <CreatePartnerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(msg) => {
          setShowCreateModal(false);
          setFlashMsg(msg);
          dispatch(fetchUsers());
        }}
      />

      <UserLockConfirmModal
        user={confirmAction?.user}
        action={confirmAction?.action}
        loading={Boolean(confirmAction && toggleLoadingId === confirmAction.user?.ma_nguoi_dung)}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmToggle}
      />

      {(flashMsg || successMsg || error) && (
        <div className={`mgmt-toast ${flashMsg || successMsg ? "success" : "error"}`}>
          {flashMsg || successMsg || error}
        </div>
      )}

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên, email, SĐT..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={handleStatusTabChange}
      >
        <DownSelect
          className="mgmt-select-inline"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Lọc theo vai trò"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="khach_hang">Khách hàng</option>
          <option value="doi_tac">Đối tác</option>
        </DownSelect>
        <DownSelect
          className="mgmt-select-inline"
          value={statusFilter}
          onChange={(e) => handleStatusTabChange(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="hoat_dong">Đang hoạt động</option>
          <option value="bi_khoa">Đã khóa</option>
        </DownSelect>
        <FilterActions showApply={false} onClear={clearFilters} />
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{emptyListMessage}</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Mã</th>
                    <th className="mgmt-col-name">Họ Tên</th>
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
                    const isActive = user.trang_thai === "hoat_dong";
                    const status = ACCOUNT_BADGE[user.trang_thai]
                      || { label: user.trang_thai, cls: "badge-default" };
                    return (
                      <tr key={user.ma_nguoi_dung}>
                        <td className="admin-cell-id">#{user.ma_nguoi_dung}</td>
                        <td className="mgmt-col-name">
                          <div className="mgmt-name-cell">
                            <span className="mgmt-avatar-initial" aria-hidden>
                              {getNameInitial(name)}
                            </span>
                            <span className="admin-cell-name">{name}</span>
                          </div>
                        </td>
                        <td className="admin-cell-muted">{user.email}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{user.so_dien_thoai || "—"}</td>
                        <td style={{ fontSize: 13, color: "#475569" }}>
                          {ROLE_LABEL[user.vai_tro] || user.vai_tro}
                        </td>
                        <td>
                          <span className={`badge ${status.cls}`}>{status.label}</span>
                        </td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => navigate(`/admin/users/${user.ma_nguoi_dung}`, {
                              state: { returnTo: buildAdminUsersListPath(statusFilter) },
                            })}
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
