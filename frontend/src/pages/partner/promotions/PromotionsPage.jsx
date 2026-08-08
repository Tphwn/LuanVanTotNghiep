import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Lock, Unlock } from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterActions from '../../../components/common/management/FilterActions';
import SummaryStats from '../../../components/common/management/SummaryStats';
import DateInput from '../../../components/common/DateInput';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import { PROMOTION_BADGE } from '../../../constants/statusConfig';
import { formatDateVN as formatDate } from '../../../utils/formatDate';

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  total: 0, cho_duyet: 0, hoat_dong: 0, tu_choi: 0, het_han: 0, an: 0,
};

const formatPromoUsage = (item) => {
  const used = Math.max(0, Number(item?.so_luot_da_dung) || 0);
  if (item?.so_luot_toi_da != null) {
    return `${used} / ${item.so_luot_toi_da}`;
  }
  return String(used);
};

const LOAI_GIAM = {
  phan_tram: 'Phần trăm (%)',
  so_tien: 'Số tiền (VNĐ)',
};

const TIME_PRESETS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7', label: '7 ngày qua' },
  { value: '30', label: '30 ngày qua' },
  { value: 'custom', label: 'Tùy chọn' },
];

const CONFIRM_CONFIG = {
  lock: {
    title: 'Tạm ngưng khuyến mãi',
    intro: 'Khuyến mãi sẽ ngừng hiển thị với khách hàng. Admin không thể tự mở khóa.',
    variant: 'danger',
    confirmText: 'Tạm ngưng',
    icon: <Lock size={20} />,
    reason: { required: true, label: 'Lý do tạm ngưng', id: 'partner-promo-lock-reason' },
    endpoint: (id) => ({ url: `/partner/promotions/${id}/lock`, withReason: true }),
  },
  restore: {
    title: 'Kích hoạt lại khuyến mãi',
    intro: 'Khuyến mãi sẽ hoạt động trở lại sau khi được kích hoạt.',
    variant: 'primary',
    confirmText: 'Kích hoạt',
    icon: <Unlock size={20} />,
    endpoint: (id) => ({ url: `/partner/promotions/${id}/restore`, withReason: false }),
  },
};

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
const formatGiaTri = (item) => (item.loai_giam === 'phan_tram'
  ? `${item.gia_tri}%`
  : `${formatCurrency(item.gia_tri)} VNĐ`);
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const maxDate = (a, b) => (!a ? b : !b ? a : a >= b ? a : b);

const canPartnerRestore = (item) => (
  item.trang_thai === 'an' && item.khoa_boi_doi_tac && !item.khoa_boi_admin
);

const canPartnerLock = (item) => item.trang_thai === 'hoat_dong' && !item.khoa_boi_admin;

/** Cho phép sửa kể cả khi admin khóa — chỉ hoạt động lại sau khi admin mở. */
const canPartnerEdit = () => true;

const emptyForm = {
  ma_khach_san: '',
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

const FieldError = ({ msg }) => (msg ? <p className="form-field-error">{msg}</p> : null);
const inputCls = (err) => `search-input${err ? ' input-invalid' : ''}`;
const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');
const formatThousandInput = (v) => {
  const digits = onlyDigits(v);
  return digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
};

const DetailModal = ({ item, onClose, onAction, onEdit, actionLoading }) => {
  if (!item) return null;
  const st = PROMOTION_BADGE[item.trang_thai] || { label: item.trang_thai, cls: 'badge-default' };

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
            <InfoRow label="Khách sạn" value={item.khach_san?.ten} />
            <InfoRow label="Loại giảm" value={LOAI_GIAM[item.loai_giam] || item.loai_giam} />
            <InfoRow label="Giá trị giảm" value={formatGiaTri(item)} />
            {item.giam_toi_da != null && (
              <InfoRow label="Giảm tối đa" value={`${formatCurrency(item.giam_toi_da)} VNĐ`} />
            )}
            <InfoRow label="Đơn tối thiểu" value={`${formatCurrency(item.don_hang_toi_thieu)} VNĐ`} />
            <InfoRow
              label="Thời gian áp dụng"
              value={`${formatDate(item.ngay_bat_dau)} – ${formatDate(item.ngay_ket_thuc)}`}
            />
            <InfoRow
              label="Số lượt sử dụng"
              value={formatPromoUsage(item)}
            />
            {item.ly_do && <InfoRow label="Lý do" value={item.ly_do} />}
            {item.khoa_boi_admin && (
              <InfoRow
                label="Khóa bởi admin"
                value="Có thể sửa nội dung; chỉ hoạt động lại khi admin mở khóa"
              />
            )}
            {item.khoa_boi_doi_tac && !item.khoa_boi_admin && (
              <InfoRow label="Tạm ngưng" value="Do bạn tạm ngưng" />
            )}
          </div>
        </div>
        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {canPartnerEdit(item) && (
            <ActionButton variant="edit" icon={Pencil} disabled={actionLoading} onClick={() => onEdit(item)}>
              Sửa
            </ActionButton>
          )}
          {canPartnerLock(item) && (
            <ActionButton variant="lock" icon={Lock} disabled={actionLoading} onClick={() => onAction(item, 'lock')}>
              Tạm ngưng
            </ActionButton>
          )}
          {canPartnerRestore(item) && (
            <ActionButton variant="unlock" icon={Unlock} disabled={actionLoading} onClick={() => onAction(item, 'restore')}>
              Kích hoạt
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

const FormModal = ({
  editing, form, updateField, errors, saving, onClose, onSubmit, hotels,
}) => {
  const isPercent = form.loai_giam === 'phan_tram';
  const today = todayLocal();
  const minStart = today;
  const minEnd = maxDate(today, form.ngay_bat_dau);
  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()} role="presentation">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h2 className="modal-title">{editing ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}</h2>
        <p style={{ fontSize: 13, color: '#5a7a72', marginBottom: 16 }}>
          {editing
            ? 'Lưu thay đổi sẽ áp dụng ngay nếu khuyến mãi không bị khóa. Nếu đang bị admin khóa, chỉ hoạt động lại khi admin mở khóa.'
            : 'Khuyến mãi sẽ áp dụng ngay sau khi tạo (trong thời hạn hiệu lực). Admin có thể khóa nếu không hợp lý.'}
        </p>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label>Khách sạn</label>
            <select
              className={inputCls(errors.ma_khach_san)}
              value={form.ma_khach_san}
              onChange={(e) => updateField('ma_khach_san', e.target.value)}
              disabled={!!editing}
            >
              <option value="">-- Chọn khách sạn --</option>
              {hotels.map((h) => (
                <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
              ))}
            </select>
            <FieldError msg={errors.ma_khach_san} />
          </div>
          <div className="form-group">
            <label>Mã khuyến mãi</label>
            <input
              className={inputCls(errors.ma_code)}
              value={form.ma_code}
              onChange={(e) => updateField('ma_code', e.target.value.toUpperCase())}
              disabled={!!editing}
              placeholder="VD: SUMMER2026"
            />
            <FieldError msg={errors.ma_code} />
          </div>
          <div className="form-group">
            <label>Tên chương trình</label>
            <input
              className={inputCls(errors.ten)}
              value={form.ten}
              onChange={(e) => updateField('ten', e.target.value)}
            />
            <FieldError msg={errors.ten} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Loại giảm</label>
              <select
                className="search-input"
                value={form.loai_giam}
                onChange={(e) => updateField('loai_giam', e.target.value)}
              >
                {Object.entries(LOAI_GIAM).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{isPercent ? 'Giá trị giảm (%)' : 'Số tiền giảm (VNĐ)'}</label>
              {isPercent ? (
                <input
                  className={inputCls(errors.gia_tri)}
                  type="number"
                  value={form.gia_tri}
                  onChange={(e) => updateField('gia_tri', e.target.value)}
                />
              ) : (
                <input
                  className={inputCls(errors.gia_tri)}
                  type="text"
                  inputMode="numeric"
                  value={formatThousandInput(form.gia_tri)}
                  onChange={(e) => updateField('gia_tri', onlyDigits(e.target.value))}
                  placeholder="VD: 50.000"
                />
              )}
              <FieldError msg={errors.gia_tri} />
            </div>
          </div>
          {isPercent && (
            <div className="form-group">
              <label>Giảm tối đa (VNĐ)</label>
              <input
                className={inputCls(errors.giam_toi_da)}
                type="text"
                inputMode="numeric"
                value={formatThousandInput(form.giam_toi_da)}
                onChange={(e) => updateField('giam_toi_da', onlyDigits(e.target.value))}
                placeholder="Không bắt buộc"
              />
              <FieldError msg={errors.giam_toi_da} />
            </div>
          )}
          <div className="form-group">
            <label>Đơn tối thiểu (VNĐ)</label>
            <input
              className={inputCls(errors.don_hang_toi_thieu)}
              type="text"
              inputMode="numeric"
              value={formatThousandInput(form.don_hang_toi_thieu)}
              onChange={(e) => updateField('don_hang_toi_thieu', onlyDigits(e.target.value))}
            />
            <FieldError msg={errors.don_hang_toi_thieu} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Từ ngày</label>
              <DateInput
                className={inputCls(errors.ngay_bat_dau)}
                value={form.ngay_bat_dau}
                min={minStart}
                onChange={(e) => updateField('ngay_bat_dau', e.target.value)}
              />
              <FieldError msg={errors.ngay_bat_dau} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <DateInput
                className={inputCls(errors.ngay_ket_thuc)}
                value={form.ngay_ket_thuc}
                min={minEnd}
                onChange={(e) => updateField('ngay_ket_thuc', e.target.value)}
              />
              <FieldError msg={errors.ngay_ket_thuc} />
            </div>
          </div>
          <div className="form-group">
            <label>Số lượt tối đa (để trống = không giới hạn)</label>
            <input
              className={inputCls(errors.so_luot_toi_da)}
              type="number"
              value={form.so_luot_toi_da}
              onChange={(e) => updateField('so_luot_toi_da', e.target.value)}
            />
            <FieldError msg={errors.so_luot_toi_da} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PartnerPromotionsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [loaiGiamFilter, setLoaiGiamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timePreset, setTimePreset] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  const [detailItem, setDetailItem] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const firstLoad = useRef(true);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...getDateRange(timePreset, tuNgay, denNgay) };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      if (loaiGiamFilter !== 'all') params.loai_giam = loaiGiamFilter;
      if (statusFilter !== 'all') params.trang_thai = statusFilter;

      const res = await api.get('/partner/promotions', { params });
      setItems(res.data.data || []);
      setStats(res.data.stats || EMPTY_STATS);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải khuyến mãi', 'error');
      setItems([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [keyword, hotelFilter, loaiGiamFilter, statusFilter, timePreset, tuNgay, denNgay, showToast]);

  useEffect(() => {
    api.get('/partner/promotions/hotels').then((res) => {
      setHotels(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadPromotions, firstLoad.current ? 0 : 300);
    firstLoad.current = false;
    return () => clearTimeout(t);
  }, [loadPromotions]);

  const clearFilters = () => {
    setKeyword('');
    setHotelFilter('');
    setLoaiGiamFilter('all');
    setStatusFilter('all');
    setTimePreset('all');
    setTuNgay('');
    setDenNgay('');
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = (f) => {
    const e = {};
    const today = todayLocal();
    const isPercent = f.loai_giam === 'phan_tram';
    const originalStart = editing?.ngay_bat_dau?.slice?.(0, 10) || '';

    if (!f.ma_khach_san) e.ma_khach_san = 'Vui lòng chọn khách sạn.';
    if (!f.ten.trim()) e.ten = 'Tên khuyến mãi không được để trống.';
    if (!f.ma_code.trim()) e.ma_code = 'Mã khuyến mãi không được để trống.';

    const giaTri = Number(f.gia_tri);
    if (f.gia_tri === '' || Number.isNaN(giaTri) || giaTri <= 0) {
      e.gia_tri = isPercent ? 'Giá trị giảm phải lớn hơn 0.' : 'Số tiền giảm phải lớn hơn 0.';
    } else if (isPercent && giaTri > 100) {
      e.gia_tri = 'Phần trăm giảm không được vượt quá 100%.';
    } else if (!isPercent && giaTri < 0) {
      e.gia_tri = 'Số tiền giảm không được âm.';
    }

    if (isPercent && f.giam_toi_da !== '') {
      const gtd = Number(f.giam_toi_da);
      if (Number.isNaN(gtd) || gtd <= 0) e.giam_toi_da = 'Giảm tối đa phải lớn hơn 0.';
    }

    if (f.don_hang_toi_thieu !== '') {
      const dh = Number(f.don_hang_toi_thieu);
      if (Number.isNaN(dh) || dh < 0) e.don_hang_toi_thieu = 'Đơn tối thiểu không được âm.';
    }

    if (!f.ngay_bat_dau) e.ngay_bat_dau = 'Vui lòng chọn ngày bắt đầu.';
    if (!f.ngay_ket_thuc) e.ngay_ket_thuc = 'Vui lòng chọn ngày kết thúc.';
    if (f.ngay_bat_dau && f.ngay_ket_thuc && f.ngay_ket_thuc < f.ngay_bat_dau) {
      e.ngay_ket_thuc = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
    }
    if (f.ngay_bat_dau && f.ngay_bat_dau < today && f.ngay_bat_dau !== originalStart) {
      e.ngay_bat_dau = 'Ngày bắt đầu không được nằm trong quá khứ.';
    }
    if (f.ngay_ket_thuc && f.ngay_ket_thuc < today) {
      e.ngay_ket_thuc = 'Ngày kết thúc không được nằm trong quá khứ.';
    }

    if (f.so_luot_toi_da !== '') {
      const sl = Number(f.so_luot_toi_da);
      if (!Number.isInteger(sl) || sl < 1) e.so_luot_toi_da = 'Số lượt tối đa phải là số nguyên ≥ 1.';
    }

    return e;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      ma_khach_san: hotelFilter || (hotels[0] ? String(hotels[0].ma_khach_san) : ''),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setDetailItem(null);
    setEditing(item);
    setFormErrors({});
    setForm({
      ma_khach_san: String(item.ma_khach_san || ''),
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
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      showToast('Vui lòng kiểm tra lại thông tin khuyến mãi', 'error');
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        ma_khach_san: Number(form.ma_khach_san),
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

      const res = editing
        ? await api.put(`/partner/promotions/${editing.ma_khuyen_mai}`, payload)
        : await api.post('/partner/promotions', payload);

      showToast(res.data.message || 'Thành công');
      setFormOpen(false);
      loadPromotions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi lưu khuyến mãi';
      if (/tồn tại|trùng/i.test(msg)) {
        setFormErrors((prev) => ({ ...prev, ma_code: msg }));
      }
      showToast(msg, 'error');
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
    { label: 'Đang hoạt động', value: stats.hoat_dong ?? 0, tone: 'success' },
    { label: 'Hết hạn', value: stats.het_han ?? 0, tone: 'muted' },
    { label: 'Bị khóa', value: stats.an ?? 0, tone: 'muted' },
  ], [stats]);

  const {
    pagedItems, currentPage, totalPages, setPage, pageNumbers, rangeFrom, rangeTo, showPagination,
  } = useListPagination(items, PAGE_SIZE, [
    keyword, hotelFilter, loaiGiamFilter, statusFilter, timePreset, tuNgay, denNgay,
  ]);

  const confirmCfg = confirmTarget ? CONFIRM_CONFIG[confirmTarget.action] : null;

  return (
    <div className="mgmt-page partner-promotions-page">
      <ManagementHeader
        title="Khuyến mãi"
        subtitle="Tạo và quản lý mã giảm giá — áp dụng ngay; admin có thể khóa nếu không hợp lý"
        actionLabel="Tạo khuyến mãi"
        onAction={openCreate}
      />

      <Toast toast={toast} />

      <SummaryStats items={statItems} />

      <div className="mgmt-toolbar mgmt-toolbar--filters">
        <div className="partner-promotions-filters-fields">
          <div className="mgmt-filter-field mgmt-filter-field--grow">
            <label className="mgmt-filter-label" htmlFor="partner-promo-keyword">Tìm kiếm</label>
            <input
              id="partner-promo-keyword"
              type="search"
              className="mgmt-select-inline"
              placeholder="Mã khuyến mãi, tên khuyến mãi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="mgmt-filter-field">
            <label className="mgmt-filter-label" htmlFor="partner-promo-hotel">Khách sạn</label>
            <select
              id="partner-promo-hotel"
              className="mgmt-select-inline"
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
            >
              <option value="">Tất cả khách sạn</option>
              {hotels.map((h) => (
                <option key={h.ma_khach_san} value={String(h.ma_khach_san)}>{h.ten}</option>
              ))}
            </select>
          </div>

          <div className="mgmt-filter-field">
            <label className="mgmt-filter-label" htmlFor="partner-promo-loaigiam">Loại khuyến mãi</label>
            <select
              id="partner-promo-loaigiam"
              className="mgmt-select-inline"
              value={loaiGiamFilter}
              onChange={(e) => setLoaiGiamFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="phan_tram">Phần trăm (%)</option>
              <option value="so_tien">Số tiền (VNĐ)</option>
            </select>
          </div>

          <div className="mgmt-filter-field">
            <label className="mgmt-filter-label" htmlFor="partner-promo-status">Trạng thái</label>
            <select
              id="partner-promo-status"
              className="mgmt-select-inline"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="hoat_dong">Đang hoạt động</option>
              <option value="an">Bị khóa</option>
              <option value="het_han">Hết hạn</option>
            </select>
          </div>

          <div className="mgmt-filter-field">
            <label className="mgmt-filter-label" htmlFor="partner-promo-time">Thời gian</label>
            <select
              id="partner-promo-time"
              className="mgmt-select-inline"
              value={timePreset}
              onChange={(e) => setTimePreset(e.target.value)}
            >
              {TIME_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {timePreset === 'custom' && (
            <>
              <div className="mgmt-filter-field">
                <label className="mgmt-filter-label" htmlFor="partner-promo-from">Từ ngày</label>
                <DateInput
                  id="partner-promo-from"
                  className="mgmt-select-inline"
                  value={tuNgay}
                  onChange={(e) => setTuNgay(e.target.value)}
                />
              </div>
              <div className="mgmt-filter-field">
                <label className="mgmt-filter-label" htmlFor="partner-promo-to">Đến ngày</label>
                <DateInput
                  id="partner-promo-to"
                  className="mgmt-select-inline"
                  value={denNgay}
                  min={tuNgay}
                  onChange={(e) => setDenNgay(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mgmt-filter-field mgmt-filter-field--action">
          <FilterActions showApply={false} onClear={clearFilters} />
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="empty-state"><p className="empty-state-text">Đang tải...</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có khuyến mãi nào</p>
            <button type="button" className="btn btn-primary" onClick={openCreate} style={{ marginTop: 12 }}>
              Tạo khuyến mãi đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th className="partner-col-code">Mã khuyến mãi</th>
                    <th className="partner-col-name">Tên khuyến mãi</th>
                    <th className="partner-col-hotel">Khách sạn</th>
                    <th className="partner-col-type">Loại giảm</th>
                    <th className="partner-col-daterange">Thời gian áp dụng</th>
                    <th className="partner-col-count">Lượt sử dụng</th>
                    <th className="partner-col-status">Trạng thái</th>
                    <th className="partner-col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
                    const st = PROMOTION_BADGE[item.trang_thai] || { label: item.trang_thai, cls: 'badge-default' };
                    return (
                      <tr key={item.ma_khuyen_mai}>
                        <td className="partner-col-code"><strong>{item.ma_code}</strong></td>
                        <td className="partner-col-name">{item.ten}</td>
                        <td className="partner-col-hotel">{item.khach_san?.ten || '—'}</td>
                        <td className="partner-col-type">{LOAI_GIAM[item.loai_giam] || item.loai_giam}</td>
                        <td className="partner-col-daterange">{formatDate(item.ngay_bat_dau)} – {formatDate(item.ngay_ket_thuc)}</td>
                        <td className="partner-col-count">
                          {formatPromoUsage(item)}
                        </td>
                        <td className="partner-col-status">
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                          {item.khoa_boi_admin && (
                            <div style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>Admin đã khóa</div>
                          )}
                          {item.khoa_boi_doi_tac && !item.khoa_boi_admin && (
                            <div style={{ fontSize: 11, color: '#856404', marginTop: 4 }}>Bạn đã tạm ngưng</div>
                          )}
                        </td>
                        <ActionCell className="partner-col-actions">
                          <ActionButton variant="view" iconOnly icon={Eye} title="Chi tiết" onClick={() => setDetailItem(item)} />
                          {canPartnerEdit(item) && (
                            <ActionButton variant="edit" iconOnly icon={Pencil} title="Sửa" onClick={() => openEdit(item)} />
                          )}
                          {canPartnerLock(item) && (
                            <ActionButton variant="lock" iconOnly icon={Lock} title="Tạm ngưng" onClick={() => setConfirmTarget({ item, action: 'lock' })} />
                          )}
                          {canPartnerRestore(item) && (
                            <ActionButton variant="unlock" iconOnly icon={Unlock} title="Kích hoạt" onClick={() => setConfirmTarget({ item, action: 'restore' })} />
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
          updateField={updateField}
          errors={formErrors}
          saving={saving}
          hotels={hotels}
          onClose={() => !saving && setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmTarget && confirmCfg && (
        <ConfirmModal
          open
          title={confirmCfg.title}
          intro={confirmCfg.intro}
          variant={confirmCfg.variant}
          confirmText={confirmCfg.confirmText}
          icon={confirmCfg.icon}
          reason={confirmCfg.reason}
          loading={actionLoading}
          onClose={() => !actionLoading && setConfirmTarget(null)}
          onConfirm={handleConfirm}
          details={[
            { label: 'Mã khuyến mãi', value: confirmTarget.item.ma_code },
            { label: 'Tên chương trình', value: confirmTarget.item.ten },
          ]}
        />
      )}
    </div>
  );
};

export default PartnerPromotionsPage;
