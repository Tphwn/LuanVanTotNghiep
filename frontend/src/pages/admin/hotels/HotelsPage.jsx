import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import StarRating from "../../../components/common/management/StarRating";
import HotelThumb from "../../../components/common/management/HotelThumb";

const PAGE_SIZE = 10;

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "mgmt-status-text--pending" },
  hoat_dong: { label: "Đang hoạt động", cls: "mgmt-status-text--active" },
  tu_choi: { label: "Từ chối", cls: "mgmt-status-text--locked" },
  bi_khoa: { label: "Đã khóa", cls: "mgmt-status-text--locked" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "mgmt-status-text--pending" },
  da_duyet: { label: "Đã duyệt", cls: "mgmt-status-text--active" },
};

const TAB_STATUS_MAP = {
  all: null,
  hoat_dong: "hoat_dong",
  cho_duyet: "cho_duyet",
  tu_choi: "tu_choi",
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels = [], loading = false } = useSelector((state) => state.adminHotels || {});

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [starFilter, setStarFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, starFilter, partnerFilter, locationFilter, debouncedKeyword]);

  const stats = useMemo(() => ({
    total: hotels.length,
    hoatDong: hotels.filter((h) => h.trang_thai === "hoat_dong" || h.trang_thai === "da_duyet").length,
    choDuyet: hotels.filter((h) => h.trang_thai === "cho_duyet").length,
    biKhoa: hotels.filter((h) => h.trang_thai === "bi_khoa" || h.trang_thai === "tu_choi").length,
  }), [hotels]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "hoat_dong", label: "Đang hoạt động", count: stats.hoatDong },
    { id: "cho_duyet", label: "Chờ duyệt", count: stats.choDuyet },
    { id: "tu_choi", label: "Đã khóa", count: stats.biKhoa },
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
    const text = debouncedKeyword.toLowerCase().trim();
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
  }, [hotels, activeTab, starFilter, partnerFilter, locationFilter, debouncedKeyword]);

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

  const handleApprove = async (hotel, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Duyệt khách sạn "${hotel.ten}" hoạt động trên sàn?`)) return;
    const result = await dispatch(approveHotel(hotel.ma_khach_san));
    if (approveHotel.rejected.match(result)) {
      alert(result.payload || "Duyệt khách sạn thất bại");
    }
  };

  const handleReject = async (hotel, e) => {
    e?.stopPropagation();
    const reason = window.prompt(`Nhập lý do từ chối "${hotel.ten}":`);
    if (!reason?.trim()) return;
    const result = await dispatch(rejectHotel({ id: hotel.ma_khach_san, lyDo: reason.trim() }));
    if (rejectHotel.rejected.match(result)) {
      alert(result.payload || "Từ chối khách sạn thất bại");
    }
  };

  const handleToggleActive = async (hotel) => {
    if (hotel.trang_thai === "hoat_dong") {
      if (!window.confirm(`Khóa khách sạn "${hotel.ten}"?`)) return;
      setToggleLoadingId(hotel.ma_khach_san);
      const result = await dispatch(lockHotel(hotel.ma_khach_san));
      setToggleLoadingId(null);
      if (lockHotel.rejected.match(result)) {
        alert(result.payload || "Khóa khách sạn thất bại");
      }
    } else if (hotel.trang_thai === "bi_khoa") {
      if (!window.confirm(`Mở khóa khách sạn "${hotel.ten}"?`)) return;
      setToggleLoadingId(hotel.ma_khach_san);
      const result = await dispatch(unlockHotel(hotel.ma_khach_san));
      setToggleLoadingId(null);
      if (unlockHotel.rejected.match(result)) {
        alert(result.payload || "Mở khóa khách sạn thất bại");
      }
    }
  };

  const canToggle = (status) => status === "hoat_dong" || status === "bi_khoa";

  const rangeFrom = filteredHotels.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filteredHotels.length);

  return (
    <div className="mgmt-page mgmt-list-page">
      <ManagementHeader title="Quản Lý Khách Sạn" />

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên hoặc địa chỉ..."
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mgmt-toolbar">
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
      </div>

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
              <table className="data-table data-table-grid mgmt-list-table">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>Mã</th>
                    <th style={{ width: 80 }}>Ảnh đại diện</th>
                    <th style={{ width: 180 }}>Tên khách sạn</th>
                    <th style={{ width: 120 }}>Đối tác</th>
                    <th>Địa chỉ</th>
                    <th style={{ width: 150 }}>Sao</th>
                    <th style={{ width: 160 }}>Trạng Thái</th>
                    <th style={{ width: 88 }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHotels.map((hotel) => {
                    const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "" };
                    const isActive = hotel.trang_thai === "hoat_dong";
                  const partnerUserLocked = hotel.doi_tac?.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung?.trang_thai === "bi_khoa";
                  const partnerLockedHotel = hotel.trang_thai === "bi_khoa" && partnerUserLocked;
                    return (
                      <tr key={hotel.ma_khach_san}>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{hotel.ma_khach_san}</td>
                        <td><HotelThumb hotel={hotel} /></td>
                        <td>
                          <div className="mgmt-cell-name">{hotel.ten}</div>
                        </td>
                        <td className="hotels-partner-cell">
                          {hotel.doi_tac?.ten_cong_ty || "—"}
                        </td>
                        <td className="hotels-address-cell">
                          <div className="mgmt-cell-address hotels-address-full">
                            {hotel.dia_chi || "—"}
                          </div>
                        </td>
                        <td><StarRating value={hotel.so_sao} /></td>
                        <td>
                          <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                        </td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => navigate(`/admin/hotels/${hotel.ma_khach_san}`)}
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
