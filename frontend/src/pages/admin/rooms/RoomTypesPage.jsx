import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { resolveUploadUrl } from "../../../utils/media";
import { Eye, Lock, Unlock } from "lucide-react";
import ActionButton, { ActionCell } from "../../../components/common/ActionButton";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Number(v) || 0);

const ROOM_STATUS = {
  hoat_dong: { label: "Đang mở", cls: "badge-success"},
  an:        { label:"Đã ẩn", cls: "badge-warning"},
};

const getMainImage = (room) => {
  const imgs = room?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh) || imgs[0];
};

const RoomTypesPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (hotelFilter !== "all") params.ma_khach_san = hotelFilter;
      if (partnerFilter !== "all") params.ma_doi_tac = partnerFilter;
      if (statusFilter !== "all") params.trang_thai = statusFilter;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();

      const res = await api.get("/admin/room-types", { params });
      setRooms(res.data.data || []);
      setHotels(res.data.hotels || []);
      setPartners(res.data.partners || []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hotelFilter, partnerFilter, statusFilter, debouncedKeyword]);

  const filteredHotels = useMemo(() => {
    if (partnerFilter === "all") return hotels;
    return hotels.filter((h) => String(h.ma_doi_tac) === String(partnerFilter));
  }, [hotels, partnerFilter]);

  useEffect(() => {
    if (hotelFilter !== "all"&& !filteredHotels.some((h) => String(h.ma_khach_san) === String(hotelFilter))) {
      setHotelFilter("all");
    }
  }, [filteredHotels, hotelFilter]);

  const handleToggleStatus = async (room) => {
    const isHidden = room.trang_thai === "an";
    const msg = isHidden
      ? `Mở lại loại phòng "${room.ten_loai}"?`
      : `Ẩn loại phòng "${room.ten_loai}"khỏi hệ thống?`;
    if (!window.confirm(msg)) return;

    try {
      const endpoint = isHidden ?"show":"hide";
      await api.patch(`/admin/room-types/${room.ma_loai_phong}/${endpoint}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý loại phòng</h1>
          <p className="page-subtitle">Giám sát và kiểm soát loại phòng của tất cả khách sạn</p>
        </div>
      </div>

      <div className="content-card"style={{ marginBottom: 16, padding:"16px 20px"}}>
        <div style={{ display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end"}}>
          <div>
            <label style={{ fontSize: 12, color:"#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Khách sạn</label>
            <select className="search-input"style={{ width:"100%"}} value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
              <option value="all">Tất cả khách sạn</option>
              {filteredHotels.map((h) => (
                <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Đối tác</label>
            <select className="search-input"style={{ width:"100%"}} value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)}>
              <option value="all">Tất cả đối tác</option>
              {partners.map((p) => (
                <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten_cong_ty}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Trạng thái</label>
            <select className="search-input"style={{ width:"100%"}} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="hoat_dong">Đang mở</option>
              <option value="an">Đã ẩn</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#5a7a72", fontWeight: 500, display: "block", marginBottom: 6 }}>Tìm kiếm</label>
            <input
              type="text"className="search-input"style={{ width:"100%"}}
              placeholder="Tên phòng, khách sạn..."value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          {(hotelFilter !=="all"|| partnerFilter !=="all"|| statusFilter !=="all"|| keyword) && (
            <div>
              <button
                type="button"className="btn btn-ghost btn-sm"style={{ width:"100%"}}
                onClick={() => {
                  setKeyword("");
                  setHotelFilter("all");
                  setPartnerFilter("all");
                  setStatusFilter("all");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách loại phòng ({rooms.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#5a7a72"}}> Đang tải dữ liệu...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có loại phòng nào phù hợp bộ lọc</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto"}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Loại phòng</th>
                  <th>Khách sạn</th>
                  <th>Giá cơ bản</th>
                  <th>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const st = ROOM_STATUS[room.trang_thai] || { label: room.trang_thai, cls: "badge-default"};
                  const thumb = getMainImage(room);
                  const isHidden = room.trang_thai ==="an";
                  return (
                    <tr key={room.ma_loai_phong}>
                      <td>
                        <div style={{
                          width: 56, height: 44, borderRadius: 8, overflow: "hidden",
                          background: "#e8f5f1", border: "1px solid #d4ede6",
                        }}>
                          {thumb ? (
                            <img src={resolveUploadUrl(thumb.url)} alt=""style={{ width:"100%", height: "100%", objectFit: "cover"}} />
                          ) : (
                            <div style={{ width:"100%", height: "100%", background: "#e8f5f1"}} />
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color:"#1a2e28"}}>{room.ten_loai}</div>
                        <div style={{ fontSize: 12, color:"#888"}}>{room.ma_loai_phong}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{room.khach_san?.ten}</div>
                        <div style={{ fontSize: 12, color:"#5a7a72"}}>{room.khach_san?.doi_tac?.ten_cong_ty}</div>
                      </td>
                      <td style={{ fontWeight: 600, color:"#b36b00", whiteSpace: "nowrap"}}>{fmt(room.gia_co_ban)} ₫</td>
                      <td style={{ whiteSpace:"nowrap"}}>{room.suc_chua} khách</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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
