import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, Check, X } from "lucide-react";
import {
  fetchHotels,
  approveHotel,
  rejectHotel,
  lockHotel,
  unlockHotel,
} from "../../../store/slices/adminHotelSlice";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import SearchBar from "../../../components/common/management/SearchBar";
import FilterTabs from "../../../components/common/management/FilterTabs";
import ToggleSwitch from "../../../components/common/management/ToggleSwitch";
import StarRating from "../../../components/common/management/StarRating";
import HotelThumb from "../../../components/common/management/HotelThumb";

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "badge-warning" },
  hoat_dong: { label: "Đã duyệt", cls: "badge-success" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "badge-info" },
  da_duyet: { label: "Đã duyệt", cls: "badge-success" },
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
    dangBan: hotels.filter((h) => h.trang_thai === "hoat_dong").length,
  }), [hotels]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: hotels.length },
    { id: "hoat_dong", label: "Đã duyệt", count: stats.hoatDong },
    { id: "cho_duyet", label: "Chờ duyệt", count: stats.choDuyet },
    { id: "tu_choi", label: "Từ chối", count: hotels.filter((h) => h.trang_thai === "tu_choi").length },
  ], [hotels.length, stats]);

  const filteredHotels = useMemo(() => {
    const statusFilter = TAB_STATUS_MAP[activeTab];
    const text = debouncedKeyword.toLowerCase().trim();
    return (hotels || []).filter((hotel) => {
      const matchStatus = !statusFilter || hotel.trang_thai === statusFilter;
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

  const handleApprove = (hotel, e) => {
    e?.stopPropagation();
    if (window.confirm(`Duyệt khách sạn "${hotel.ten}" hoạt động trên sàn?`)) {
      dispatch(approveHotel(hotel.ma_khach_san));
    }
  };

  const handleReject = (hotel, e) => {
    e?.stopPropagation();
    const reason = window.prompt(`Nhập lý do từ chối "${hotel.ten}":`);
    if (reason?.trim()) dispatch(rejectHotel({ id: hotel.ma_khach_san, lyDo: reason.trim() }));
  };

  const handleToggleActive = (hotel) => {
    if (hotel.trang_thai === "hoat_dong") {
      if (window.confirm(`Khóa khách sạn "${hotel.ten}"?`)) dispatch(lockHotel(hotel.ma_khach_san));
    } else if (hotel.trang_thai === "bi_khoa") {
      if (window.confirm(`Mở khóa khách sạn "${hotel.ten}"?`)) dispatch(unlockHotel(hotel.ma_khach_san));
    }
  };

  const canToggle = (status) => status === "hoat_dong" || status === "bi_khoa";

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý khách sạn"
        subtitle="Duyệt, kiểm tra và quản lý các cơ sở lưu trú trên hệ thống"
      />

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên hoặc địa chỉ..."
        />
        <select
          className="mgmt-select-inline"
          value={starFilter}
          onChange={(e) => setStarFilter(e.target.value)}
        >
          <option value="all">Tất cả hạng sao</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} sao</option>
          ))}
        </select>
      </div>

      <FilterTabs tabs={filterTabs} active={activeTab} onChange={setActiveTab} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không tìm thấy khách sạn phù hợp</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <colgroup>
                <col className="mgmt-col-img" />
                <col />
                <col />
                <col className="mgmt-col-type" />
                <col className="mgmt-col-star" />
                <col className="mgmt-col-status" />
                <col className="mgmt-col-toggle" />
                <col style={{ width: 118 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên khách sạn</th>
                  <th>Địa chỉ</th>
                  <th>Loại hình</th>
                  <th>Sao</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: "badge-default" };
                  const isActive = hotel.trang_thai === "hoat_dong";
                  return (
                    <tr key={hotel.ma_khach_san}>
                      <td><HotelThumb hotel={hotel} /></td>
                      <td>
                        <div className="mgmt-cell-name">{hotel.ten}</div>
                        <div className="mgmt-cell-sub">{hotel.doi_tac?.ten_cong_ty}</div>
                      </td>
                      <td>
                        <div className="mgmt-cell-address" title={hotel.dia_chi}>
                          {hotel.dia_chi || "—"}
                        </div>
                      </td>
                      <td><span className="mgmt-type-tag">{getLoaiHinh(hotel)}</span></td>
                      <td><StarRating value={hotel.so_sao} /></td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <ToggleSwitch
                          compact
                          checked={isActive}
                          onChange={() => handleToggleActive(hotel)}
                          disabled={!canToggle(hotel.trang_thai)}
                          labelOn="Đang hoạt động"
                          labelOff="Tạm ngừng"
                        />
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => navigate(`/admin/hotels/${hotel.ma_khach_san}`)}
                        />
                        <ActionButton
                          variant="approve"
                          iconOnly
                          icon={Check}
                          title="Duyệt"
                          disabled={hotel.trang_thai !== "cho_duyet"}
                          onClick={(e) => handleApprove(hotel, e)}
                        />
                        <ActionButton
                          variant="reject"
                          iconOnly
                          icon={X}
                          title="Từ chối"
                          disabled={hotel.trang_thai !== "cho_duyet"}
                          onClick={(e) => handleReject(hotel, e)}
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

export default HotelsPage;
