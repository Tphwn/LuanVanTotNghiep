import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Check, X, Lock, Unlock } from "lucide-react";
import {
  fetchHotels,
  approveHotel,
  rejectHotel,
  lockHotel,
  unlockHotel,
} from "../../../store/slices/adminHotelSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import ManagementToolbar from "../../../components/common/management/ManagementToolbar";
import FilterActions from "../../../components/common/management/FilterActions";
import StarRating from "../../../components/common/management/StarRating";
import HotelThumb from "../../../components/common/management/HotelThumb";
import HotelLockConfirmModal from "./components/HotelLockConfirmModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { getHotelStatusMeta } from "../../../constants/statusConfig";
import { buildAdminHotelsListPath } from "../../../utils/adminListReturn";

const PAGE_SIZE = 10;

const VALID_TABS = ["all", "hoat_dong", "cho_duyet", "tu_choi"];

const TAB_STATUS_MAP = {
  all: null,
  hoat_dong: "hoat_dong",
  cho_duyet: "cho_duyet",
  tu_choi: "tu_choi",
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hotels = [], loading = false } = useSelector((state) => state.adminHotels || {});

  const tabFromUrl = searchParams.get("tab");
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "all"
  );
  const [starFilter, setStarFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const [flashMsg, setFlashMsg] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  useEffect(() => {
    const tab = searchParams.get("tab") || "all";
    if (VALID_TABS.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, starFilter, partnerFilter, locationFilter, keyword]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "all") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  useEffect(() => {
    if (!flashMsg) return undefined;
    const t = setTimeout(() => setFlashMsg(""), 4000);
    return () => clearTimeout(t);
  }, [flashMsg]);

  const stats = useMemo(() => ({
    total: hotels.length,
    hoatDong: hotels.filter((h) => h.trang_thai === "hoat_dong" || h.trang_thai === "da_duyet").length,
    choDuyet: hotels.filter((h) => h.trang_thai === "cho_duyet").length,
    biKhoa: hotels.filter((h) => h.trang_thai === "bi_khoa" || h.trang_thai === "tu_choi").length,
  }), [hotels]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats.total, tone: "neutral" },
    { id: "hoat_dong", label: "Đang hoạt động", count: stats.hoatDong, tone: "success" },
    { id: "cho_duyet", label: "Chờ duyệt", count: stats.choDuyet, tone: "warning" },
    { id: "tu_choi", label: "Đã khóa", count: stats.biKhoa, tone: "danger" },
  ], [stats]);

  const partnerOptions = useMemo(() => {
    const map = new Map();
    (hotels || []).forEach((hotel) => {
      const partner = hotel.doi_tac;
      if (partner?.ma_doi_tac) {
        map.set(partner.ma_doi_tac, partner.ten_cong_ty);
      }
    });
    return Array.from(map, ([ma_doi_tac, ten_cong_ty]) => ({ ma_doi_tac, ten_cong_ty }))
      .sort((a, b) => (a.ten_cong_ty || "").localeCompare(b.ten_cong_ty || "", "vi"));
  }, [hotels]);

  const locationOptions = useMemo(() => {
    const map = new Map();
    (hotels || []).forEach((hotel) => {
      const location = hotel.dia_diem;
      if (location?.ma_dia_diem) {
        map.set(location.ma_dia_diem, location.ten_dia_diem);
      }
    });
    return Array.from(map, ([ma_dia_diem, ten_dia_diem]) => ({ ma_dia_diem, ten_dia_diem }))
      .sort((a, b) => (a.ten_dia_diem || "").localeCompare(b.ten_dia_diem || "", "vi"));
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    const statusFilter = TAB_STATUS_MAP[activeTab];
    const text = keyword.toLowerCase().trim();
    return (hotels || []).filter((hotel) => {
      let matchStatus = true;
      if (activeTab === "tu_choi") {
        matchStatus = ["tu_choi", "bi_khoa"].includes(hotel.trang_thai);
      } else if (statusFilter) {
        matchStatus = hotel.trang_thai === statusFilter;
      } else if (activeTab === "hoat_dong") {
        matchStatus = ["hoat_dong", "da_duyet"].includes(hotel.trang_thai);
      }
      const matchStar = starFilter === "all" || hotel.so_sao === Number(starFilter);
      const partnerId = hotel.ma_doi_tac ?? hotel.doi_tac?.ma_doi_tac;
      const locationId = hotel.ma_dia_diem ?? hotel.dia_diem?.ma_dia_diem;
      const matchPartner = partnerFilter === "all" || String(partnerId) === partnerFilter;
      const matchLocation = locationFilter === "all" || String(locationId) === locationFilter;
      if (!text) return matchStatus && matchStar && matchPartner && matchLocation;
      const loc = hotel.dia_diem?.ten_dia_diem;
      const matchKeyword =
        hotel.ten?.toLowerCase().includes(text)
        || hotel.doi_tac?.ten_cong_ty?.toLowerCase().includes(text)
        || hotel.dia_chi?.toLowerCase().includes(text)
        || loc?.toLowerCase().includes(text);
      return matchStatus && matchStar && matchPartner && matchLocation && matchKeyword;
    });
  }, [hotels, activeTab, starFilter, partnerFilter, locationFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedHotels = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredHotels.slice(start, start + PAGE_SIZE);
  }, [filteredHotels, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const handleApprove = (hotel, e) => {
    e?.stopPropagation();
    setPendingAction({ hotel, type: "approve" });
  };

  const handleReject = (hotel, e) => {
    e?.stopPropagation();
    setPendingAction({ hotel, type: "reject" });
  };

  const handleConfirmAction = async (reason) => {
    if (!pendingAction) return;
    const { hotel, type } = pendingAction;
    setActionLoading(true);
    setActionError("");
    const thunk = type === "approve"
      ? approveHotel(hotel.ma_khach_san)
      : rejectHotel({ id: hotel.ma_khach_san, lyDo: reason });
    const result = await dispatch(thunk);
    setActionLoading(false);
    const ok = type === "approve"
      ? approveHotel.fulfilled.match(result)
      : rejectHotel.fulfilled.match(result);
    if (ok) {
      setPendingAction(null);
      setFlashMsg(
        type === "approve"
          ? "Duyệt thành công"
          : "Đã gửi lý do từ chối"
      );
      return;
    }
    setActionError(result.payload || (type === "approve" ? "Duyệt khách sạn thất bại" : "Từ chối khách sạn thất bại"));
  };

  const handleToggleActive = (hotel) => {
    if (hotel.trang_thai === "hoat_dong") {
      setConfirmAction({ hotel, action: "lock" });
      return;
    }
    if (hotel.trang_thai === "bi_khoa") {
      setConfirmAction({ hotel, action: "unlock" });
    }
  };

  const handleCloseConfirm = () => {
    if (toggleLoadingId) return;
    setConfirmAction(null);
  };

  const handleConfirmToggle = async (lyDoKhoa) => {
    if (!confirmAction) return;

    const { hotel, action } = confirmAction;
    const isLock = action === "lock";

    setToggleLoadingId(hotel.ma_khach_san);
    setActionError("");
    const thunk = isLock
      ? lockHotel({ id: hotel.ma_khach_san, lyDoKhoa })
      : unlockHotel(hotel.ma_khach_san);
    const result = await dispatch(thunk);
    setToggleLoadingId(null);

    if (lockHotel.fulfilled.match(result) || unlockHotel.fulfilled.match(result)) {
      setConfirmAction(null);
      setFlashMsg(isLock ? "Đã khóa thành công" : "Đã mở khóa thành công");
      return;
    }

    setActionError(result.payload || (isLock ? "Khóa thất bại" : "Mở khóa thất bại"));
  };

  const canToggle = (status) => status === "hoat_dong" || status === "bi_khoa";

  const rangeFrom = filteredHotels.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filteredHotels.length);

  const clearFilters = () => {
    setKeyword("");
    setActiveTab("all");
    setPartnerFilter("all");
    setLocationFilter("all");
    setStarFilter("all");
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="mgmt-page mgmt-list-page admin-hotels-page">
      <ManagementHeader title="Quản Lý Khách Sạn" />

      {(flashMsg || actionError) && (
        <div className={`mgmt-toast ${flashMsg ? "success" : "error"}`}>
          {flashMsg || actionError}
        </div>
      )}

      <HotelLockConfirmModal
        hotel={confirmAction?.hotel}
        action={confirmAction?.action}
        loading={Boolean(confirmAction && toggleLoadingId === confirmAction.hotel?.ma_khach_san)}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmToggle}
      />

      <ConfirmModal
        open={Boolean(pendingAction)}
        variant={pendingAction?.type === "reject" ? "danger" : "primary"}
        icon={pendingAction?.type === "reject" ? <X size={20} /> : <Check size={20} />}
        title={pendingAction?.type === "reject" ? "Từ chối khách sạn" : "Duyệt khách sạn"}
        intro={pendingAction?.type === "reject"
          ? "Khách sạn sẽ bị từ chối và không hiển thị trên sàn. Vui lòng nhập lý do rõ ràng."
          : "Bạn có chắc muốn duyệt khách sạn này hoạt động trên sàn?"}
        infoRows={[
          { label: "Tên khách sạn", value: pendingAction?.hotel?.ten },
          { label: "Đối tác", value: pendingAction?.hotel?.doi_tac?.ten_cong_ty || "—" },
        ]}
        reason={pendingAction?.type === "reject" ? {
          required: true,
          id: "hotel-reject-reason",
          label: "Lý do từ chối",
          placeholder: "VD: Thông tin không chính xác, chưa đủ điều kiện...",
          hint: "Lý do sẽ được gửi thông báo cho đối tác.",
        } : undefined}
        confirmText={pendingAction?.type === "reject" ? "Xác nhận từ chối" : "Duyệt hoạt động"}
        loading={actionLoading}
        onClose={() => { if (!actionLoading) setPendingAction(null); }}
        onConfirm={handleConfirmAction}
      />

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên hoặc địa chỉ..."
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <select
          className="mgmt-select-inline"
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          aria-label="Lọc theo đối tác"
        >
          <option value="all">Tất cả đối tác</option>
          {partnerOptions.map((partner) => (
            <option key={partner.ma_doi_tac} value={partner.ma_doi_tac}>
              {partner.ten_cong_ty}
            </option>
          ))}
        </select>
        <select
          className="mgmt-select-inline"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          aria-label="Lọc theo địa điểm"
        >
          <option value="all">Tất cả địa điểm</option>
          {locationOptions.map((location) => (
            <option key={location.ma_dia_diem} value={location.ma_dia_diem}>
              {location.ten_dia_diem}
            </option>
          ))}
        </select>
        <select
          className="mgmt-select-inline"
          value={starFilter}
          onChange={(e) => setStarFilter(e.target.value)}
          aria-label="Lọc theo hạng sao"
        >
          <option value="all">Tất cả hạng sao</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} sao</option>
          ))}
        </select>
        <FilterActions showApply={false} onClear={clearFilters} />
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy khách sạn phù hợp</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>Mã</th>
                    <th className="admin-hotels-name-col">Khách sạn</th>
                    <th className="hotels-partner-cell mgmt-col-name">Đối tác</th>
                    <th className="hotels-address-cell mgmt-col-address">Địa chỉ</th>
                    <th style={{ width: 72 }}>Sao</th>
                    <th style={{ width: 140 }}>Trạng Thái</th>
                    <th style={{ width: 88 }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHotels.map((hotel) => {
                    const st = getHotelStatusMeta(hotel, { variant: "badge" });
                    const isActive = hotel.trang_thai === "hoat_dong";
                    const partnerLockedHotel = Boolean(hotel.khoa_do_doi_tac);
                    return (
                      <tr key={hotel.ma_khach_san}>
                        <td className="admin-cell-id">#{hotel.ma_khach_san}</td>
                        <td className="admin-hotels-name-col">
                          <div className="mgmt-name-cell">
                            <HotelThumb hotel={hotel} />
                            <div className="admin-cell-name">{hotel.ten}</div>
                          </div>
                        </td>
                        <td className="hotels-partner-cell mgmt-col-name">
                          {hotel.doi_tac?.ten_cong_ty || "—"}
                        </td>
                        <td className="hotels-address-cell mgmt-col-address">
                          <div className="mgmt-cell-address hotels-address-full">
                            {hotel.dia_chi || "—"}
                          </div>
                        </td>
                        <td><StarRating value={hotel.so_sao} /></td>
                        <td>
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => navigate(`/admin/hotels/${hotel.ma_khach_san}`, {
                              state: { returnTo: buildAdminHotelsListPath(activeTab) },
                            })}
                          />
                          {hotel.trang_thai === "cho_duyet" && (
                            <>
                              <ActionButton
                                variant="approve"
                                iconOnly
                                icon={Check}
                                title="Duyệt"
                                onClick={(e) => handleApprove(hotel, e)}
                              />
                              <ActionButton
                                variant="reject"
                                iconOnly
                                icon={X}
                                title="Từ chối"
                                onClick={(e) => handleReject(hotel, e)}
                              />
                            </>
                          )}
                          {canToggle(hotel.trang_thai) && (
                            <ActionButton
                              variant={isActive ? "lock" : "unlock"}
                              iconOnly
                              icon={isActive ? Lock : Unlock}
                              title={partnerLockedHotel ? "Bị khóa do đối tác" : (isActive ? "Khóa khách sạn" : "Mở khóa")}
                              onClick={() => handleToggleActive(hotel)}
                              disabled={toggleLoadingId === hotel.ma_khach_san || partnerLockedHotel}
                            />
                          )}
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredHotels.length > PAGE_SIZE && (
              <div className="mgmt-list-pagination">
                <span className="mgmt-list-pagination-info">
                  Hiển thị {rangeFrom}–{rangeTo} / {filteredHotels.length}
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

export default HotelsPage;
