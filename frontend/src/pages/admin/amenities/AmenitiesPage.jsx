import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAmenities, addAmenity, updateAmenity, removeAmenity,
  fetchRequests, approveRequest, rejectRequest,
} from "../../../store/slices/amenitySlice";
import {
  suggestIconSlugFromName, resolveIconSlug,
} from "../../../utils/amenityIcons";
import {
  Pencil, Trash2, Plus, Building2, BedDouble,
  Wifi, Tv, Bell, Check, X, ConciergeBell, MapPin,
  Waves, ParkingCircle, UtensilsCrossed, ChefHat, Thermometer, Dumbbell,
  Sparkles, Wind, Droplets, Coffee, Sunset, Flower2, Lock, GlassWater,
  Shield, Accessibility, Users, Baby, Bus, Luggage, Phone, KeyRound,
  Shirt, Monitor, Car, Utensils, Pill, Wine, ArrowUpDown, PawPrint,
  Bike, Ship, Gamepad2, Trees,
} from "lucide-react";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import SearchBar from "../../../components/common/management/SearchBar";

/* ── Slug → Lucide icon map ───────────────────────────────────── */
const SLUG_ICON_MAP = {
  wifi:        Wifi,
  pool:        Waves,
  parking:     ParkingCircle,
  restaurant:  UtensilsCrossed,
  kitchen:     ChefHat,
  fridge:      Thermometer,
  gym:         Dumbbell,
  spa:         Sparkles,
  massage:     Sparkles,
  ac:          Wind,
  tv:          Tv,
  bathtub:     Droplets,
  breakfast:   Coffee,
  coffee:      Coffee,
  balcony:     Sunset,
  bed:         BedDouble,
  laundry:     Shirt,
  elevator:    ArrowUpDown,
  pet:         PawPrint,
  bar:         Wine,
  beach:       Waves,
  garden:      Flower2,
  safe:        Lock,
  minibar:     GlassWater,
  security:    Shield,
  accessible:  Accessibility,
  meeting:     Users,
  kids:        Baby,
  shuttle:     Bus,
  luggage:     Luggage,
  phone:       Phone,
  key:         KeyRound,
  iron:        Shirt,
  hairdryer:   Wind,
  desk:        Monitor,
  car:         Car,
  food:        Utensils,
  medicine:    Pill,
  bike:        Bike,
  boat:        Ship,
  game:        Gamepad2,
  garden2:     Trees,
};

const getAmenityLucideIcon = (slugOrName) => {
  const slug = suggestIconSlugFromName(slugOrName) || slugOrName;
  return SLUG_ICON_MAP[slug] || ConciergeBell;
};

/* ── Loại tiện nghi / trạng thái ──────────────────────────────── */
const inferLoaiDeXuat = (req) => {
  if (req.loai_de_xuat) return req.loai_de_xuat;
  const moTa = (req.mo_ta || '').toLowerCase();
  if (moTa.includes('loại phòng') || moTa.includes('loai phong')) return 'phong';
  if (moTa.includes('khách sạn') || moTa.includes('khach san')) return 'khach_san';
  return null;
};

const LOAI_LABEL = {
  khach_san: { label: "Khách sạn", cls: "badge-info" },
  phong:     { label: "Loại phòng", cls: "badge-success" },
  ca_hai:    { label: "Cả hai", cls: "badge-warning" },
};

const REQUEST_STATUS = {
  cho_xu_ly: { label: "Đang chờ", cls: "badge-warning" },
  da_tao:    { label: "Đã duyệt", cls: "badge-success" },
  tu_choi:   { label: "Từ chối", cls: "badge-danger" },
};

/* ── Nhóm danh mục ────────────────────────────────────────────── */
const HOTEL_CATEGORY_GROUPS = [
  {
    id: 'dich_vu', label: 'Dịch vụ khách sạn', Icon: ConciergeBell,
    slugs: ['pool','gym','spa','massage','restaurant','bar','breakfast','laundry','coffee','shuttle','beach','garden','luggage','meeting','kids','pet','security','accessible'],
  },
  {
    id: 'cong_cong', label: 'Tiện nghi công cộng', Icon: Building2,
    slugs: ['wifi','elevator','parking'],
  },
  {
    id: 'lan_can', label: 'Các tiện ích lân cận', Icon: MapPin,
    slugs: [],
  },
];

const ROOM_CATEGORY_GROUPS = [
  {
    id: 'phong', label: 'Tiện nghi phòng', Icon: BedDouble,
    slugs: ['ac','fridge','bathtub','balcony','bed','safe','minibar','hairdryer','iron','desk','kitchen','coffee','phone','laundry'],
  },
  {
    id: 'ket_noi', label: 'Kết nối mạng', Icon: Wifi,
    slugs: ['wifi','tv'],
  },
  {
    id: 'giai_tri', label: 'Giải trí', Icon: Tv,
    slugs: [],
  },
];

const groupAmenitiesByCategory = (items, categoryGroups) => {
  const groups = categoryGroups.map((g) => ({ ...g, items: [] }));
  const catchAll = groups.find((g) => g.slugs.length === 0);
  items.forEach((item) => {
    const slug = item.bieu_tuong || suggestIconSlugFromName(item.ten);
    let assigned = false;
    for (const g of groups) {
      if (g.slugs.length > 0 && g.slugs.includes(slug)) {
        g.items.push(item);
        assigned = true;
        break;
      }
    }
    if (!assigned && catchAll) catchAll.items.push(item);
  });
  return groups.filter((g) => g.items.length > 0 || g.slugs.length === 0);
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};

/* ── Sub-components ───────────────────────────────────────────── */
const AmenityGroupCard = ({ group, onEdit, onDelete, onAdd }) => (
  <div className="amenity-group-card">
    <div className="amenity-group-header">
      <div className="amenity-group-icon-wrap">
        <group.Icon size={17} strokeWidth={1.5} />
      </div>
      <div>
        <div className="amenity-group-title">{group.label}</div>
        <div className="amenity-group-sub">{group.items.length} tiện nghi</div>
      </div>
    </div>
    <div className="amenity-group-list">
      {group.items.length === 0 ? (
        <div className="amenity-group-empty">Chưa có tiện nghi</div>
      ) : (
          group.items.map((item) => {
            const ItemIcon = getAmenityLucideIcon(item.bieu_tuong || item.ten);
            return (
            <div key={item.ma_tien_nghi} className="amenity-group-item">
              <ItemIcon size={15} strokeWidth={1.6} className="amenity-group-item-icon" />
              <span className="amenity-group-item-name">{item.ten}</span>
            {(item._count || item.so_luong) != null && (
              <span className="amenity-group-item-count">
                {item._count?.total ?? item._count ?? item.so_luong}
              </span>
            )}
            <div className="amenity-group-item-btns">
              <button
                type="button"
                className="amenity-icon-btn amenity-icon-btn-edit"
                title="Sửa"
                onClick={() => onEdit(item)}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="amenity-icon-btn amenity-icon-btn-delete"
                title="Xóa"
                onClick={() => onDelete(item.ma_tien_nghi)}
              >
                <Trash2 size={13} />
              </button>
            </div>
            </div>
          );})
        )}
      </div>
      <button type="button" className="amenity-group-add-btn" onClick={onAdd}>
      <Plus size={14} />
      Thêm tiện nghi
    </button>
  </div>
);

const RequestCard = ({ req, onApprove, onReject }) => {
  const isPending = req.trang_thai === 'cho_xu_ly';
  const loaiDx = inferLoaiDeXuat(req);
  const loaiInfo = loaiDx ? LOAI_LABEL[loaiDx] : { label: 'Chưa rõ', cls: 'badge-default' };
  const st = REQUEST_STATUS[req.trang_thai] || { label: req.trang_thai, cls: 'badge-default' };
  return (
    <div className="request-card">
      <div className="request-card-body">
        <div className="request-card-info">
          <div className="request-card-title">{req.ten_de_xuat}</div>
          <div className="request-card-tags">
            <span className={`badge ${loaiInfo.cls}`}>{loaiInfo.label}</span>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <div className="request-card-meta">
            Đề xuất bởi <strong>{req.doi_tac?.ten_cong_ty || '—'}</strong>
            {req.doi_tac?.ten_khach_san && ` · ${req.doi_tac.ten_khach_san}`}
            {req.ngay_yeu_cau && ` · ${formatTimeAgo(req.ngay_yeu_cau)}`}
          </div>
          {req.mo_ta && (
            <div className="request-card-quote">"{req.mo_ta}"</div>
          )}
          {!isPending && req.phan_hoi && (
            <div className="request-card-feedback">
              Phản hồi: {req.phan_hoi}
            </div>
          )}
        </div>
        <div className="request-card-actions">
          <button
            type="button"
            className="btn-request-reject"
            disabled={!isPending}
            onClick={() => isPending && onReject(req.ma_yeu_cau)}
          >
            <X size={13} /> Từ chối
          </button>
          <button
            type="button"
            className="btn-request-approve"
            disabled={!isPending}
            onClick={() => isPending && onApprove(req)}
          >
            <Check size={13} /> Duyệt & thêm
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────── */
const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {}
  );

  const [activeTab, setActiveTab] = useState("hotel");
  const [form, setForm] = useState({ ten: "", bieu_tuong: "wifi", loai: "khach_san" });
  const [editId, setEditId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveModal, setApproveModal] = useState(null);
  const [approveForm, setApproveForm] = useState({ loai: "ca_hai", bieu_tuong: "wifi" });
  const [iconManual, setIconManual] = useState(false);
  const [requestFilter, setRequestFilter] = useState("cho_xu_ly");
  const [addModal, setAddModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchRequests());
  }, [dispatch]);

  const pendingCount = requests.filter((r) => r.trang_thai === "cho_xu_ly").length;
  const approvedCount = requests.filter((r) => r.trang_thai === "da_tao").length;
  const rejectedCount = requests.filter((r) => r.trang_thai === "tu_choi").length;

  const hotelAmenities = useMemo(
    () => list.filter((item) => item.loai === "khach_san" || item.loai === "ca_hai"),
    [list]
  );
  const roomAmenities = useMemo(
    () => list.filter((item) => item.loai === "phong" || item.loai === "ca_hai"),
    [list]
  );

  const currentLoai = activeTab === "hotel" ? "khach_san" : activeTab === "room" ? "phong" : null;

  const hotelGroups = useMemo(() => groupAmenitiesByCategory(hotelAmenities, HOTEL_CATEGORY_GROUPS), [hotelAmenities]);
  const roomGroups  = useMemo(() => groupAmenitiesByCategory(roomAmenities, ROOM_CATEGORY_GROUPS), [roomAmenities]);
  const currentGroups = activeTab === "hotel" ? hotelGroups : roomGroups;

  const filteredGroups = useMemo(() => {
    if (!keyword) return currentGroups;
    return currentGroups
      .map((g) => ({ ...g, items: g.items.filter((item) => item.ten?.toLowerCase().includes(keyword.toLowerCase())) }))
      .filter((g) => g.items.length > 0);
  }, [currentGroups, keyword]);

  const filteredRequests = requests.filter((req) => {
    if (requestFilter === "all") return true;
    return req.trang_thai === requestFilter;
  });

  const resetForm = (loai) => {
    setForm({ ten: "", bieu_tuong: "wifi", loai: loai || currentLoai || "khach_san" });
    setEditId(null);
    setIconManual(false);
  };

  const handleNameChange = (ten) => {
    const next = { ...form, ten };
    if (!iconManual && !editId) next.bieu_tuong = suggestIconSlugFromName(ten);
    setForm(next);
  };

  const handleSubmit = () => {
    if (!form.ten.trim()) return alert("Vui lòng nhập tên tiện nghi");
    const iconSlug = resolveIconSlug(form.bieu_tuong, form.ten);
    const payload = { ...form, ten: form.ten.trim(), bieu_tuong: iconSlug };
    if (editId) {
      dispatch(updateAmenity({ id: editId, data: payload }));
      setEditId(null);
    } else {
      dispatch(addAmenity(payload));
    }
    resetForm(currentLoai);
    setAddModal(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setKeyword("");
    if (tab === "hotel") resetForm("khach_san");
    else if (tab === "room") resetForm("phong");
  };

  const handleEdit = (item) => {
    setEditId(item.ma_tien_nghi);
    setForm({ ten: item.ten, bieu_tuong: item.bieu_tuong || suggestIconSlugFromName(item.ten), loai: item.loai });
    setIconManual(true);
    setActiveTab(item.loai === "phong" ? "room" : "hotel");
    setAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Xóa tiện nghi này?")) dispatch(removeAmenity(id));
  };

  const openApprove = (req) => {
    const loai = inferLoaiDeXuat(req) || 'ca_hai';
    const icon = suggestIconSlugFromName(req.ten_de_xuat);
    setApproveModal(req);
    setApproveForm({ loai, bieu_tuong: icon });
  };

  const handleApproveSubmit = () => {
    if (!approveModal) return;
    const bieu_tuong = resolveIconSlug(approveForm.bieu_tuong, approveModal.ten_de_xuat);
    dispatch(approveRequest({
      id: approveModal.ma_yeu_cau,
      loai: approveForm.loai,
      bieu_tuong,
    })).then(() => {
      dispatch(fetchAmenities());
      dispatch(fetchRequests());
      setApproveModal(null);
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");
    dispatch(rejectRequest({ id: rejectModal, phan_hoi: rejectReason })).then(() => {
      dispatch(fetchRequests());
      setRejectModal(null);
      setRejectReason("");
    });
  };

  const openAddModal = () => {
    resetForm(currentLoai);
    setAddModal(true);
  };

  return (
    <div>
      {/* Header */}
      <ManagementHeader
        title="Quản lý Tiện nghi"
        subtitle="Quản lý danh mục tiện nghi khách sạn và loại phòng. Khách hàng tìm kiếm khách sạn dựa trên các tiện nghi này."
        actionLabel={activeTab !== "requests" ? "Thêm tiện nghi" : undefined}
        onAction={activeTab !== "requests" ? openAddModal : undefined}
        actionIcon={Plus}
      />

      {/* Stats */}
      <div className="amenity-stats-row">
        <div className="amenity-stat-card">
          <div className="amenity-stat-icon" style={{ background: "#e8f5f1", color: "#3C7363" }}>
            <Building2 size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div className="amenity-stat-label">Tiện nghi khách sạn</div>
            <div className="amenity-stat-value">{hotelAmenities.length}</div>
            <div className="amenity-stat-sub">{hotelGroups.filter(g => g.items.length > 0).length} danh mục</div>
          </div>
        </div>
        <div className="amenity-stat-card">
          <div className="amenity-stat-icon" style={{ background: "#eef2ff", color: "#0958d9" }}>
            <BedDouble size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div className="amenity-stat-label">Tiện nghi loại phòng</div>
            <div className="amenity-stat-value">{roomAmenities.length}</div>
            <div className="amenity-stat-sub">{roomGroups.filter(g => g.items.length > 0).length} danh mục</div>
          </div>
        </div>
        <div className="amenity-stat-card">
          <div className="amenity-stat-icon" style={{ background: "#fff8e6", color: "#b36b00" }}>
            <Bell size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div className="amenity-stat-label">Yêu cầu đang chờ</div>
            <div className="amenity-stat-value">{pendingCount}</div>
            <div className="amenity-stat-sub">Từ đối tác</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="amenity-tabs-row">
        {[
          { id: "hotel",    icon: Building2,     label: "Tiện nghi khách sạn" },
          { id: "room",     icon: BedDouble,      label: "Tiện nghi loại phòng" },
          { id: "requests", icon: Bell,           label: "Yêu cầu từ đối tác", badge: pendingCount },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            type="button"
            className={`amenity-tab-btn${activeTab === id ? " active" : ""}`}
            onClick={() => handleTabChange(id)}
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
            {badge > 0 && <span className="amenity-tab-badge">{badge}</span>}
          </button>
        ))}
      </div>

      {(activeTab === "hotel" || activeTab === "room") && (
        <>
          <div className="amenity-toolbar">
            <SearchBar
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tiện nghi..."
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#5a7a72" }}>Đang tải...</div>
          ) : (
            <div className="amenity-grid">
              {filteredGroups.map((group) => (
                <AmenityGroupCard
                  key={group.id}
                  group={group}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAdd={openAddModal}
                />
              ))}
              {filteredGroups.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#5a7a72" }}>
                  {keyword ? "Không tìm thấy tiện nghi phù hợp" : "Chưa có tiện nghi nào"}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "requests" && (
        <>
          <div className="content-card" style={{ marginBottom: 0 }}>
            <div className="request-section-header">
              <div>
                <div className="request-section-title">Yêu cầu thêm tiện nghi từ đối tác</div>
                <div className="request-section-sub">Xét duyệt để thêm vào danh mục chính.</div>
              </div>
              <div className="request-subtabs">
                {[
                  { id: "cho_xu_ly", label: "Đang chờ",  count: pendingCount },
                  { id: "da_tao",    label: "Đã duyệt",  count: approvedCount },
                  { id: "tu_choi",   label: "Từ chối",   count: rejectedCount },
                  { id: "all",       label: "Tất cả",    count: requests.length },
                ].map(({ id, label, count }) => (
                  <button
                    key={id}
                    type="button"
                    className={`request-subtab-btn${requestFilter === id ? " active" : ""}`}
                    onClick={() => setRequestFilter(id)}
                  >
                    {label}
                    {count > 0 && <span className="request-subtab-count">{count}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="request-list">
              {filteredRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#5a7a72" }}>
                  Không có yêu cầu nào
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <RequestCard
                    key={req.ma_yeu_cau}
                    req={req}
                    onApprove={openApprove}
                    onReject={(id) => setRejectModal(id)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {addModal && (() => {
        const PreviewIcon = getAmenityLucideIcon(form.ten || form.bieu_tuong);
        return (
          <div className="modal-overlay" onClick={() => { setAddModal(false); resetForm(currentLoai); }}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editId ? "Chỉnh sửa tiện nghi" : "Thêm tiện nghi mới"}
                </h3>
                <button type="button" className="modal-close" onClick={() => { setAddModal(false); resetForm(currentLoai); }}>×</button>
              </div>

              {/* Icon preview + Name input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                  Tên tiện nghi <span style={{ color: "#e05c5c" }}>*</span>
                </label>
                <div className="amenity-form-name-row">
                  <div className="amenity-form-icon-preview">
                    <PreviewIcon size={24} strokeWidth={1.5} />
                  </div>
                  <input
                    className="search-input"
                    style={{ flex: 1, boxSizing: "border-box" }}
                    placeholder={activeTab === "hotel" ? "VD: Hồ bơi, Ô tô, Bãi đỗ xe..." : "VD: Tủ lạnh, Ban công..."}
                    value={form.ten}
                    onChange={(e) => handleNameChange(e.target.value)}
                    autoFocus
                  />
                </div>
                {form.ten && (
                  <div className="amenity-form-icon-hint">
                    <PreviewIcon size={12} strokeWidth={2} />
                    Icon nhận diện tự động từ tên
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Áp dụng cho
                </label>
                <div className="amenity-form-scope-row">
                  {[
                    { value: "khach_san", label: "Khách sạn", desc: "Hiển thị khi tạo khách sạn" },
                    { value: "phong", label: "Loại phòng", desc: "Hiển thị khi tạo loại phòng" },
                    { value: "ca_hai", label: "Cả hai", desc: "Khách sạn & loại phòng" },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      className={`amenity-scope-btn${form.loai === value ? " active" : ""}`}
                      onClick={() => setForm({ ...form, loai: value })}
                    >
                      <span className="amenity-scope-label">{label}</span>
                      <span className="amenity-scope-desc">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setAddModal(false); resetForm(currentLoai); }}>
                  Hủy
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  {editId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {approveModal && (() => {
        const ApproveIcon = getAmenityLucideIcon(approveModal.ten_de_xuat);
        return (
          <div className="modal-overlay" onClick={() => setApproveModal(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Duyệt đề xuất tiện nghi</h3>
                <button type="button" className="modal-close" onClick={() => setApproveModal(null)}>×</button>
              </div>

              {/* Preview tiện nghi được duyệt */}
              <div className="amenity-approve-preview">
                <div className="amenity-approve-icon">
                  <ApproveIcon size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1a2e28" }}>{approveModal.ten_de_xuat}</div>
                  <div style={{ fontSize: 13, color: "#5a7a72", marginTop: 3 }}>
                    Đề xuất bởi {approveModal.doi_tac?.ten_cong_ty}
                    {inferLoaiDeXuat(approveModal) && (
                      <span style={{ marginLeft: 8 }} className={`badge ${LOAI_LABEL[inferLoaiDeXuat(approveModal)]?.cls}`}>
                        {LOAI_LABEL[inferLoaiDeXuat(approveModal)]?.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  Áp dụng cho
                </label>
                <div className="amenity-form-scope-row">
                  {[
                    { value: "khach_san", label: "Khách sạn", desc: "Hiển thị khi tạo khách sạn" },
                    { value: "phong", label: "Loại phòng", desc: "Hiển thị khi tạo loại phòng" },
                    { value: "ca_hai", label: "Cả hai", desc: "Khách sạn & loại phòng" },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      className={`amenity-scope-btn${approveForm.loai === value ? " active" : ""}`}
                      onClick={() => setApproveForm({ ...approveForm, loai: value })}
                    >
                      <span className="amenity-scope-label">{label}</span>
                      <span className="amenity-scope-desc">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setApproveModal(null)}>Hủy</button>
                <button type="button" className="btn btn-primary" onClick={handleApproveSubmit}>Xác nhận duyệt</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal từ chối ── */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Từ chối đề xuất</h3>
              <button type="button" className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>

            <p style={{ fontSize: 14, color: "#5a7a72", marginBottom: 12 }}>
              Vui lòng nhập lý do từ chối để đối tác biết.
            </p>

            <textarea
              rows={4}
              placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", border: "1px solid #d4ede6",
                borderRadius: 8, fontSize: 14, resize: "vertical",
                fontFamily: "inherit", boxSizing: "border-box", outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setRejectModal(null)}>Hủy</button>
              <button type="button" className="btn btn-danger" onClick={handleRejectSubmit}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesPage;
