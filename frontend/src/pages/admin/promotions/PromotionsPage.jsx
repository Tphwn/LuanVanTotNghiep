import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye, Pencil, Lock, Unlock, Check, X,
} from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import { PROMOTION_BADGE } from '../../../constants/statusConfig';

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  total: 0, cho_duyet: 0, hoat_dong: 0, tu_choi: 0, het_han: 0, an: 0,
};

const LOAI_GIAM = {
  phan_tram: 'Phần trăm (%)',
  so_tien: 'Số tiền (VNĐ)',
};

const PHAM_VI = {
  he_thong: 'Toàn hệ thống',
  doi_tac: 'Đối tác',
};

// Cấu hình modal xác nhận theo từng hành động
const CONFIRM_CONFIG = {
  lock: {
    title: 'Tạm ngưng khuyến mãi',
    intro: 'Khuyến mãi sẽ ngừng áp dụng cho tới khi được khôi phục.',
    variant: 'danger',
    confirmText: 'Tạm ngưng',
    icon: <Lock size={20} />,
    reason: { required: true, label: 'Lý do tạm ngưng', id: 'promo-lock-reason' },
    endpoint: (id) => ({ url: `/admin/promotions/${id}/lock`, withReason: true }),
  },
  reject: {
    title: 'Từ chối khuyến mãi',
    intro: 'Khuyến mãi của đối tác sẽ bị từ chối và không được áp dụng.',
    variant: 'danger',
    confirmText: 'Từ chối',
    icon: <X size={20} />,
    reason: { required: true, label: 'Lý do từ chối', id: 'promo-reject-reason' },
    endpoint: (id) => ({ url: `/admin/promotions/${id}/reject`, withReason: true }),
  },
  approve: {
    title: 'Duyệt khuyến mãi',
    intro: 'Khuyến mãi của đối tác sẽ được duyệt và bắt đầu áp dụng.',
    variant: 'primary',
    confirmText: 'Duyệt',
    icon: <Check size={20} />,
    endpoint: (id) => ({ url: `/admin/promotions/${id}/approve`, withReason: false }),
  },
  restore: {
    title: 'Khôi phục khuyến mãi',
    intro: 'Khuyến mãi sẽ được kích hoạt lại và tiếp tục áp dụng.',
    variant: 'primary',
    confirmText: 'Khôi phục',
    icon: <Unlock size={20} />,
    endpoint: (id) => ({ url: `/admin/promotions/${id}/restore`, withReason: false }),
  },
};

const TIME_PRESETS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7', label: '7 ngày qua' },
  { value: '30', label: '30 ngày qua' },
  { value: 'custom', label: 'Tùy chọn' },
];

const getDateRange = (preset, customFrom, customTo) => {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    const r = {};
    if (customFrom) r.tu_ngay = customFrom;
    if (customTo) r.den_ngay = customTo;
    return r;
  }
  const days = Number(preset);
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { tu_ngay: from.toISOString().slice(0, 10) };
};

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const formatGiaTri = (item) => (item.loai_giam === 'phan_tram'
  ? `${item.gia_tri}%`
  : `${formatCurrency(item.gia_tri)} đ`);

const getCreatorName = (item) => {
  const nd = item.nguoi_dung;
  if (!nd) return '—';
  return (
    nd.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung?.ten_cong_ty
    || nd.khach_hang?.ho_ten
    || nd.email
    || '—'
  );
};

const emptyForm = {
  ma_code: '',
  ten: '',
  loai_giam: 'phan_tram',
  gia_tri: '',
  giam_toi_da: '',
  don_hang_toi_thieu: '0',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  so_luot_toi_da: '',
};

const InfoRow = ({ label, value }) => (
  <div className="user-lock-confirm-modal-row">
    <span>{label}</span>
    <strong>{value ?? '—'}</strong>
  </div>
);

// ── Popup chi tiết ──────────────────────────────────────────
const DetailModal = ({ item, onClose, onAction, onEdit, actionLoading }) => {
  if (!item) return null;
  const st = PROMOTION_BADGE[item.trang_thai] || { label: item.trang_thai, cls: 'badge-default' };
  const isSystem = item.loai_nguon === 'he_thong';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">Chi tiết khuyến mãi</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="user-lock-confirm-modal-body">
          <div style={{ marginBottom: 12 }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <div className="user-lock-confirm-modal-info">
            <InfoRow label="Mã khuyến mãi" value={item.ma_code} />
            <InfoRow label="Tên chương trình" value={item.ten} />
            <InfoRow label="Loại giảm" value={LOAI_GIAM[item.loai_giam] || item.loai_giam} />
            <InfoRow label="Giá trị giảm" value={formatGiaTri(item)} />
            {item.giam_toi_da != null && (
              <InfoRow label="Giảm tối đa" value={`${formatCurrency(item.giam_toi_da)} đ`} />
            )}
            <InfoRow label="Đơn tối thiểu" value={`${formatCurrency(item.don_hang_toi_thieu)} đ`} />
            <InfoRow label="Phạm vi áp dụng" value={PHAM_VI[item.loai_nguon] || item.loai_nguon} />
            {!isSystem && <InfoRow label="Khách sạn" value={item.khach_san?.ten} />}
            <InfoRow label="Người tạo" value={getCreatorName(item)} />
            <InfoRow
              label="Thời gian áp dụng"
              value={`${formatDate(item.ngay_bat_dau)} – ${formatDate(item.ngay_ket_thuc)}`}
            />
            <InfoRow
              label="Số lượt sử dụng"
              value={`${item.so_luot_da_dung}${item.so_luot_toi_da != null ? ` / ${item.so_luot_toi_da}` : ''}`}
            />
            {item.ly_do && <InfoRow label="Lý do" value={item.ly_do} />}
          </div>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {isSystem && (
            <ActionButton variant="edit" icon={Pencil} disabled={actionLoading} onClick={() => onEdit(item)}>
              Sửa
            </ActionButton>
          )}
          {item.trang_thai === 'cho_duyet' && (
            <>
              <ActionButton variant="reject" icon={X} disabled={actionLoading} onClick={() => onAction(item, 'reject')}>
                Từ chối
              </ActionButton>
              <ActionButton variant="approve" icon={Check} disabled={actionLoading} onClick={() => onAction(item, 'approve')}>
                Duyệt
              </ActionButton>
            </>
          )}
          {item.trang_thai === 'hoat_dong' && (
            <ActionButton variant="lock" icon={Lock} disabled={actionLoading} onClick={() => onAction(item, 'lock')}>
              Tạm ngưng
            </ActionButton>
          )}
          {(item.trang_thai === 'an' || item.trang_thai === 'tu_choi') && (
            <ActionButton variant="unlock" icon={Unlock} disabled={actionLoading} onClick={() => onAction(item, 'restore')}>
              Khôi phục
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Popup thêm / sửa (chỉ áp dụng KM nền tảng của admin) ─────
const FormModal = ({ editing, form, setForm, saving, onClose, onSubmit }) => (
  <div className="modal-overlay" onClick={() => !saving && onClose()} role="presentation">
    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
      <h2 className="modal-title">{editing ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi nền tảng'}</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Mã khuyến mãi</label>
          <input
            className="search-input"
            value={form.ma_code}
            onChange={(e) => setForm({ ...form, ma_code: e.target.value.toUpperCase() })}
            required
            disabled={!!editing}
            placeholder="VD: SUMMER2026"
          />
        </div>
        <div className="form-group">
          <label>Tên chương trình</label>
          <input
            className="search-input"
            value={form.ten}
            onChange={(e) => setForm({ ...form, ten: e.target.value })}
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Loại giảm</label>
            <select
              className="search-input"
              value={form.loai_giam}
              onChange={(e) => setForm({ ...form, loai_giam: e.target.value })}
            >
              {Object.entries(LOAI_GIAM).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Giá trị</label>
            <input
              className="search-input"
              type="number"
              min={0}
              value={form.gia_tri}
              onChange={(e) => setForm({ ...form, gia_tri: e.target.value })}
              required
            />
          </div>
        </div>
        {form.loai_giam === 'phan_tram' && (
          <div className="form-group">
            <label>Giảm tối đa (VNĐ)</label>
            <input
              className="search-input"
              type="number"
              min={0}
              value={form.giam_toi_da}
              onChange={(e) => setForm({ ...form, giam_toi_da: e.target.value })}
            />
          </div>
        )}
        <div className="form-group">
          <label>Đơn tối thiểu (VNĐ)</label>
          <input
            className="search-input"
            type="number"
            min={0}
            value={form.don_hang_toi_thieu}
            onChange={(e) => setForm({ ...form, don_hang_toi_thieu: e.target.value })}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Từ ngày</label>
            <input
              className="search-input"
              type="date"
              value={form.ngay_bat_dau}
              onChange={(e) => setForm({ ...form, ngay_bat_dau: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Đến ngày</label>
            <input
              className="search-input"
              type="date"
              value={form.ngay_ket_thuc}
              min={form.ngay_bat_dau}
              onChange={(e) => setForm({ ...form, ngay_ket_thuc: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Số lượt tối đa (để trống = không giới hạn)</label>
          <input
            className="search-input"
            type="number"
            min={1}
            value={form.so_luot_toi_da}
            onChange={(e) => setForm({ ...form, so_luot_toi_da: e.target.value })}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo khuyến mãi'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const AdminPromotionsPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [partners, setPartners] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [loaiGiamFilter, setLoaiGiamFilter] = useState('all');
  const [phamViFilter, setPhamViFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timePreset, setTimePreset] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  const [detailItem, setDetailItem] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const firstLoad = useRef(true);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...getDateRange(timePreset, tuNgay, denNgay) };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (loaiGiamFilter !== 'all') params.loai_giam = loaiGiamFilter;
      if (phamViFilter !== 'all') params.loai_nguon = phamViFilter;
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      else if (partnerFilter) params.ma_doi_tac = partnerFilter;
      if (statusFilter !== 'all') params.trang_thai = statusFilter;

      const res = await api.get('/admin/promotions', { params });
      setItems(res.data.data || []);
      setStats(res.data.stats || EMPTY_STATS);
      if (firstLoad.current) {
        setPartners(res.data.partners || []);
        setHotels(res.data.hotels || []);
        firstLoad.current = false;
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải khuyến mãi', 'error');
      setItems([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [
    keyword, loaiGiamFilter, phamViFilter, partnerFilter, hotelFilter,
    statusFilter, timePreset, tuNgay, denNgay, showToast,
  ]);

  useEffect(() => {
    const t = setTimeout(loadPromotions, firstLoad.current ? 0 : 300);
    return () => clearTimeout(t);
  }, [loadPromotions]);

  const hotelOptions = useMemo(() => hotels.filter((h) => {
    if (!partnerFilter) return true;
    return String(h.ma_doi_tac) === partnerFilter;
  }), [hotels, partnerFilter]);

  const handlePartnerChange = (value) => {
    setPartnerFilter(value);
    if (value && hotelFilter) {
      const stillValid = hotels.some(
        (h) => String(h.ma_khach_san) === hotelFilter && String(h.ma_doi_tac) === value,
      );
      if (!stillValid) setHotelFilter('');
    }
  };

  const hasActiveFilter = Boolean(
    keyword || loaiGiamFilter !== 'all' || phamViFilter !== 'all'
    || partnerFilter || hotelFilter || statusFilter !== 'all' || timePreset !== 'all',
  );

  const clearFilters = () => {
    setKeyword('');
    setLoaiGiamFilter('all');
    setPhamViFilter('all');
    setPartnerFilter('');
    setHotelFilter('');
    setStatusFilter('all');
    setTimePreset('all');
    setTuNgay('');
    setDenNgay('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setDetailItem(null);
    setEditing(item);
    setForm({
      ma_code: item.ma_code,
      ten: item.ten,
      loai_giam: item.loai_giam,
      gia_tri: String(item.gia_tri),
      giam_toi_da: item.giam_toi_da != null ? String(item.giam_toi_da) : '',
      don_hang_toi_thieu: String(item.don_hang_toi_thieu || 0),
      ngay_bat_dau: item.ngay_bat_dau?.slice?.(0, 10) || '',
      ngay_ket_thuc: item.ngay_ket_thuc?.slice?.(0, 10) || '',
      so_luot_toi_da: item.so_luot_toi_da != null ? String(item.so_luot_toi_da) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ma_code || !form.ten || !form.gia_tri || !form.ngay_bat_dau || !form.ngay_ket_thuc) {
      return showToast('Vui lòng điền đủ thông tin bắt buộc', 'error');
    }
    setSaving(true);
    try {
      const payload = {
        ma_code: form.ma_code,
        ten: form.ten,
        loai_giam: form.loai_giam,
        gia_tri: Number(form.gia_tri),
        giam_toi_da: form.giam_toi_da ? Number(form.giam_toi_da) : null,
        don_hang_toi_thieu: Number(form.don_hang_toi_thieu || 0),
        ngay_bat_dau: form.ngay_bat_dau,
        ngay_ket_thuc: form.ngay_ket_thuc,
        so_luot_toi_da: form.so_luot_toi_da ? Number(form.so_luot_toi_da) : null,
      };
      if (editing) {
        await api.put(`/admin/promotions/${editing.ma_khuyen_mai}`, payload);
        showToast('Đã cập nhật khuyến mãi');
      } else {
        await api.post('/admin/promotions', payload);
        showToast('Đã tạo khuyến mãi nền tảng');
      }
      setFormOpen(false);
      loadPromotions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi lưu khuyến mãi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (reasonValue) => {
    if (!confirmTarget) return;
    const { item, action } = confirmTarget;
    const cfg = CONFIRM_CONFIG[action];
    const { url, withReason } = cfg.endpoint(item.ma_khuyen_mai);

    setActionLoading(true);
    try {
      const res = withReason
        ? await api.patch(url, { ly_do: reasonValue })
        : await api.patch(url);
      showToast(res.data.message || 'Thành công');
      setConfirmTarget(null);
      setDetailItem(null);
      loadPromotions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const statItems = useMemo(() => [
    { label: 'Tổng khuyến mãi', value: stats.total ?? 0, tone: 'neutral' },
    { label: 'Chờ duyệt', value: stats.cho_duyet ?? 0, tone: 'warning' },
    { label: 'Đang hoạt động', value: stats.hoat_dong ?? 0, tone: 'success' },
    { label: 'Từ chối', value: stats.tu_choi ?? 0, tone: 'danger' },
    { label: 'Hết hạn', value: stats.het_han ?? 0, tone: 'muted' },
    { label: 'Tạm ngưng', value: stats.an ?? 0, tone: 'muted' },
  ], [stats]);

  const {
    pagedItems, currentPage, totalPages, setPage, pageNumbers, rangeFrom, rangeTo, showPagination,
  } = useListPagination(items, PAGE_SIZE, [
    keyword, loaiGiamFilter, phamViFilter, partnerFilter, hotelFilter, statusFilter, timePreset, tuNgay, denNgay,
  ]);

  const confirmCfg = confirmTarget ? CONFIRM_CONFIG[confirmTarget.action] : null;

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý khuyến mãi"
        subtitle="Toàn bộ khuyến mãi nền tảng và của đối tác trong hệ thống"
        actionLabel="Thêm khuyến mãi"
        onAction={openCreate}
      />

      <Toast toast={toast} />

      <div className="mgmt-toolbar mgmt-toolbar--filters">
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-keyword">Tìm kiếm</label>
          <input
            id="promo-keyword"
            className="mgmt-select-inline"
            placeholder="Tên hoặc mã khuyến mãi"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-loaigiam">Loại khuyến mãi</label>
          <select id="promo-loaigiam" className="mgmt-select-inline" value={loaiGiamFilter} onChange={(e) => setLoaiGiamFilter(e.target.value)}>
            <option value="all">Tất cả loại</option>
            <option value="phan_tram">Phần trăm (%)</option>
            <option value="so_tien">Số tiền (VNĐ)</option>
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-phamvi">Phạm vi áp dụng</label>
          <select id="promo-phamvi" className="mgmt-select-inline" value={phamViFilter} onChange={(e) => setPhamViFilter(e.target.value)}>
            <option value="all">Tất cả phạm vi</option>
            <option value="he_thong">Toàn hệ thống</option>
            <option value="doi_tac">Đối tác</option>
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-partner">Đối tác</label>
          <select id="promo-partner" className="mgmt-select-inline" value={partnerFilter} onChange={(e) => handlePartnerChange(e.target.value)}>
            <option value="">Tất cả đối tác</option>
            {partners.map((p) => (
              <option key={p.ma_doi_tac} value={String(p.ma_doi_tac)}>{p.ten_cong_ty}</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-hotel">Khách sạn</label>
          <select id="promo-hotel" className="mgmt-select-inline" value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
            <option value="">Tất cả khách sạn</option>
            {hotelOptions.map((h) => (
              <option key={h.ma_khach_san} value={String(h.ma_khach_san)}>{h.ten}</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-status">Trạng thái</label>
          <select id="promo-status" className="mgmt-select-inline" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="hoat_dong">Đang hoạt động</option>
            <option value="tu_choi">Từ chối</option>
            <option value="het_han">Hết hạn</option>
            <option value="an">Tạm ngưng</option>
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-time">Thời gian</label>
          <select id="promo-time" className="mgmt-select-inline" value={timePreset} onChange={(e) => setTimePreset(e.target.value)}>
            {TIME_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {timePreset === 'custom' && (
          <>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="promo-from">Từ ngày</label>
              <input id="promo-from" type="date" className="mgmt-select-inline" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="promo-to">Đến ngày</label>
              <input id="promo-to" type="date" className="mgmt-select-inline" value={denNgay} min={tuNgay} onChange={(e) => setDenNgay(e.target.value)} />
            </div>
          </>
        )}

        {hasActiveFilter && (
          <div className="mgmt-filter-field mgmt-filter-field--action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        )}
      </div>

      <SummaryStats items={statItems} />

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách khuyến mãi ({items.length})</h3>
        </div>

        {loading ? (
          <div className="empty-state"><p className="empty-state-text">Đang tải...</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p className="empty-state-text">Không có khuyến mãi phù hợp bộ lọc</p></div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th>Mã khuyến mãi</th>
                    <th>Tên khuyến mãi</th>
                    <th>Loại giảm</th>
                    <th>Giá trị giảm</th>
                    <th>Phạm vi</th>
                    <th>Người tạo</th>
                    <th>Thời gian áp dụng</th>
                    <th>Trạng thái</th>
                    <th style={{ width: 150 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
                    const st = PROMOTION_BADGE[item.trang_thai] || { label: item.trang_thai, cls: 'badge-default' };
                    const isSystem = item.loai_nguon === 'he_thong';
                    return (
                      <tr key={item.ma_khuyen_mai}>
                        <td><strong>{item.ma_code}</strong></td>
                        <td>{item.ten}</td>
                        <td>{LOAI_GIAM[item.loai_giam] || item.loai_giam}</td>
                        <td>{formatGiaTri(item)}</td>
                        <td>{PHAM_VI[item.loai_nguon] || item.loai_nguon}</td>
                        <td>{getCreatorName(item)}</td>
                        <td>{formatDate(item.ngay_bat_dau)} – {formatDate(item.ngay_ket_thuc)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <ActionCell>
                          <ActionButton variant="view" iconOnly icon={Eye} title="Chi tiết" onClick={() => setDetailItem(item)} />
                          {isSystem && (
                            <ActionButton variant="edit" iconOnly icon={Pencil} title="Sửa" onClick={() => openEdit(item)} />
                          )}
                          {item.trang_thai === 'cho_duyet' && (
                            <>
                              <ActionButton variant="approve" iconOnly icon={Check} title="Duyệt" onClick={() => setConfirmTarget({ item, action: 'approve' })} />
                              <ActionButton variant="reject" iconOnly icon={X} title="Từ chối" onClick={() => setConfirmTarget({ item, action: 'reject' })} />
                            </>
                          )}
                          {item.trang_thai === 'hoat_dong' && (
                            <ActionButton variant="lock" iconOnly icon={Lock} title="Tạm ngưng" onClick={() => setConfirmTarget({ item, action: 'lock' })} />
                          )}
                          {(item.trang_thai === 'an' || item.trang_thai === 'tu_choi') && (
                            <ActionButton variant="unlock" iconOnly icon={Unlock} title="Khôi phục" onClick={() => setConfirmTarget({ item, action: 'restore' })} />
                          )}
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <ListPagination
                total={items.length}
                currentPage={currentPage}
                totalPages={totalPages}
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                pageNumbers={pageNumbers}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAction={(item, action) => setConfirmTarget({ item, action })}
          onEdit={openEdit}
          actionLoading={actionLoading}
        />
      )}

      {formOpen && (
        <FormModal
          editing={editing}
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title={confirmCfg?.title}
        intro={confirmCfg?.intro}
        icon={confirmCfg?.icon}
        variant={confirmCfg?.variant}
        confirmText={confirmCfg?.confirmText}
        reason={confirmCfg?.reason}
        loading={actionLoading}
        infoRows={confirmTarget ? [
          { label: 'Mã khuyến mãi', value: confirmTarget.item.ma_code },
          { label: 'Tên', value: confirmTarget.item.ten },
        ] : []}
        onClose={() => !actionLoading && setConfirmTarget(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default AdminPromotionsPage;
