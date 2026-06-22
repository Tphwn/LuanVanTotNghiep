import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, Check, X, Lock, Unlock } from "lucide-react";
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

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "mgmt-status-text--pending" },
  hoat_dong: { label: "Đang hoạt động", cls: "mgmt-status-text--active" },
  tu_choi: { label: "Từ chối", cls: "mgmt-status-text--locked" },
  bi_khoa: { label: "Đã khóa", cls: "mgmt-status-text--locked" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "mgmt-status-text--pending" },
  da_duyet: { label: "Đã duyệt", cls: "mgmt-status-text--active" },
};

const getLoaiHinh = (hotel) => {
  const sao = hotel.so_sao || 0;
  if (sao >= 5) return "Khu nghỉ dưỡng";
  if (sao >= 3) return "Khách sạn";
  return "Homestay";
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

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
      if (!text) return matchStatus && matchStar;
      const loc = hotel.dia_diem?.ten_dia_diem;
      const matchKeyword =
        hotel.ten?.toLowerCase().includes(text)
        || hotel.doi_tac?.ten_cong_ty?.toLowerCase().includes(text)
        || hotel.dia_chi?.toLowerCase().includes(text)
        || loc?.toLowerCase().includes(text);
      return matchStatus && matchStar && matchKeyword;
    });
  }, [hotels, activeTab, starFilter, debouncedKeyword]);

  const handleApprove = async (hotel, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Duyệt khách sạn "${hotel.ten}" hoạt động trên sàn?`)) return;
    const result = await dispatch(approveHotel(hotel.ma_khach_san));
    if (approveHotel.rejected.match(result)) {
      alert(result.payload || 'Duyệt khách sạn thất bại');
    }
  };

  const handleReject = async (hotel, e) => {
    e?.stopPropagation();
    const reason = window.prompt(`Nhập lý do từ chối "${hotel.ten}":`);
    if (!reason?.trim()) return;
    const result = await dispatch(rejectHotel({ id: hotel.ma_khach_san, lyDo: reason.trim() }));
    if (rejectHotel.rejected.match(result)) {
      alert(result.payload || 'Từ chối khách sạn thất bại');
    }
  };

  const handleToggleActive = async (hotel) => {
    if (hotel.trang_thai === 'hoat_dong') {
      if (!window.confirm(`Khóa khách sạn "${hotel.ten}"?`)) return;
      const result = await dispatch(lockHotel(hotel.ma_khach_san));
      if (lockHotel.rejected.match(result)) {
        alert(result.payload || 'Khóa khách sạn thất bại');
      }
    } else if (hotel.trang_thai === 'bi_khoa') {
      if (!window.confirm(`Mở khóa khách sạn "${hotel.ten}"?`)) return;
      const result = await dispatch(unlockHotel(hotel.ma_khach_san));
      if (unlockHotel.rejected.match(result)) {
        alert(result.payload || 'Mở khóa khách sạn thất bại');
      }
    }
  };

  const canToggle = (status) => status === "hoat_dong" || status === "bi_khoa";

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Khách Sạn"
        subtitle="Duyệt, kiểm tra và quản lý các cơ sở lưu trú trên hệ thống"
      />

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên hoặc địa chỉ..."
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <select
          className="mgmt-select-inline"
          value={starFilter}
          onChange={(e) => setStarFilter(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="all">Tất cả hạng sao</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} sao</option>
          ))}
        </select>
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy khách sạn phù hợp</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>ID</th>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Tên khách sạn</th>
                  <th>Đối tác</th>
                  <th>Địa chỉ</th>
                  <th style={{ width: 110 }}>Loại hình</th>
                  <th style={{ width: 90 }}>Sao</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "" };
                  const isActive = hotel.trang_thai === "hoat_dong";
                  return (
                    <tr key={hotel.ma_khach_san}>
                      <td style={{ color: "#64748b", fontWeight: 500 }}>{hotel.ma_khach_san}</td>
                      <td><HotelThumb hotel={hotel} /></td>
                      <td>
                        <div className="mgmt-cell-name">{hotel.ten}</div>
                      </td>
                      <td style={{ fontSize: 13, color: "#64748b" }}>
                        {hotel.doi_tac?.ten_cong_ty || "—"}
                      </td>
                      <td>
                        <div className="mgmt-cell-address" title={hotel.dia_chi}>
                          {hotel.dia_chi || "—"}
                        </div>
                      </td>
                      <td><span className="mgmt-type-tag">{getLoaiHinh(hotel)}</span></td>
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
                            title={isActive ? "Khóa khách sạn" : "Mở khóa"}
                            onClick={() => handleToggleActive(hotel)}
                          />
                        )}
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

export default HotelsPage;
