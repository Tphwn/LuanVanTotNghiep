import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { resolveUploadUrl } from "../../../utils/media";
import { Eye, Lock, Unlock } from "lucide-react";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import SearchBar from "../../../components/common/management/SearchBar";
import FilterTabs from "../../../components/common/management/FilterTabs";

import { getAdminRoomTypeStatus } from "../../../constants/statuses";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Number(v) || 0);

const getMainImage = (room) => {
  const imgs = room?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh) || imgs[0];
};

const RoomTypesPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (hotelFilter !== "all") params.ma_khach_san = hotelFilter;
      if (partnerFilter !== "all") params.ma_doi_tac = partnerFilter;
      if (statusFilter !== "all") params.trang_thai = statusFilter;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();

      const res = await api.get("/admin/room-types", { params });
      setRooms(res.data.data || []);
      setStats(res.data.stats || null);
      setHotels(res.data.hotels || []);
      setPartners(res.data.partners || []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [hotelFilter, partnerFilter, statusFilter, debouncedKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredHotels = useMemo(() => {
    if (partnerFilter === "all") return hotels;
    return hotels.filter((h) => String(h.ma_doi_tac) === String(partnerFilter));
  }, [hotels, partnerFilter]);

  useEffect(() => {
    if (hotelFilter !== "all" && !filteredHotels.some((h) => String(h.ma_khach_san) === String(hotelFilter))) {
      setHotelFilter("all");
    }
  }, [filteredHotels, hotelFilter]);

  const handleTabChange = (tab) => {
    setStatusFilter(tab);
  };

  const handleToggleStatus = async (room) => {
    const isHidden = room.trang_thai === "an";
    const msg = isHidden
      ? `Mở lại loại phòng "${room.ten_loai}"?`
      : `Ẩn loại phòng "${room.ten_loai}" khỏi hệ thống?`;
    if (!window.confirm(msg)) return;

    try {
      const endpoint = isHidden ? "show" : "hide";
      await api.patch(`/admin/room-types/${room.ma_loai_phong}/${endpoint}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats?.total ?? rooms.length },
    { id: "hoat_dong", label: "Đang mở", count: stats?.active ?? 0 },
    { id: "an", label: "Đã ẩn", count: stats?.hidden ?? 0 },
  ], [stats, rooms.length]);

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý loại phòng"
        subtitle="Giám sát và kiểm soát loại phòng của tất cả khách sạn"
      />

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tên phòng, khách sạn..."
        />
        <select
          className="mgmt-select-inline"
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
        >
          <option value="all">Tất cả đối tác</option>
          {partners.map((p) => (
            <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten_cong_ty}</option>
          ))}
        </select>
        <select
          className="mgmt-select-inline"
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
        >
          <option value="all">Tất cả khách sạn</option>
          {filteredHotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
      </div>

      <FilterTabs tabs={filterTabs} active={statusFilter} onChange={handleTabChange} />

      <div className="mgmt-table-card mgmt-table-card--grid">
        <div className="mgmt-table-card-header">
          <span className="mgmt-table-card-title">Danh sách loại phòng ({rooms.length})</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72" }}>Đang tải dữ liệu...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có loại phòng nào phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Loại phòng</th>
                  <th>Khách sạn</th>
                  <th style={{ width: 120 }}>Giá cơ bản</th>
                  <th style={{ width: 100 }}>Sức chứa</th>
                  <th style={{ width: 110 }}>Trạng thái</th>
                  <th style={{ width: 100 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const st = getAdminRoomTypeStatus(room.trang_thai);
                  const thumb = getMainImage(room);
                  const isHidden = room.trang_thai === "an";
                  return (
                    <tr key={room.ma_loai_phong}>
                      <td>
                        <div className="mgmt-thumb" style={{ width: 48, height: 40, borderRadius: 8 }}>
                          {thumb ? (
                            <img src={resolveUploadUrl(thumb.url)} alt="" />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "#e8f5f1" }} />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="mgmt-cell-name">{room.ten_loai}</div>
                        <div className="mgmt-cell-sub">{room.ma_loai_phong}</div>
                      </td>
                      <td>
                        <div className="mgmt-cell-name">{room.khach_san?.ten}</div>
                        <div className="mgmt-cell-sub">{room.khach_san?.doi_tac?.ten_cong_ty}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: "#b36b00", whiteSpace: "nowrap" }}>
                        {fmt(room.gia_co_ban)} ₫
                      </td>
                      <td style={{ fontSize: 13, color: "#64748b" }}>{room.suc_chua} khách</td>
                      <td>
                        <span className={`mgmt-status-text ${st.textCls}`}>{st.label}</span>
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => navigate(`/admin/room-types/${room.ma_loai_phong}`)}
                        />
                        <ActionButton
                          variant={isHidden ? "unlock" : "lock"}
                          iconOnly
                          icon={isHidden ? Unlock : Lock}
                          title={isHidden ? "Mở bán" : "Ẩn phòng"}
                          onClick={() => handleToggleStatus(room)}
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

export default RoomTypesPage;
