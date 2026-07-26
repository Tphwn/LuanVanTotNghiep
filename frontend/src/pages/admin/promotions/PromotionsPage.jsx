import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye, Pencil, Lock, Unlock, Check, X,
} from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterActions from '../../../components/common/management/FilterActions';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import { getPromotionStatusMeta } from '../../../constants/statusConfig';

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
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const maxDate = (a, b) => (!a ? b : !b ? a : a >= b ? a : b);

const formatGiaTri = (item) => (item.loai_giam === 'phan_tram'
  ? `${item.gia_tri}%`
  : `${formatCurrency(item.gia_tri)} ₫`);

const formatGiaTriShortMax = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `${formatCurrency(n / 1_000_000)}tr`;
  if (n >= 1_000) return `${formatCurrency(n / 1_000)}k`;
  return formatCurrency(n);
};

const canAdminRestore = (item) => (
  (item.trang_thai === 'an' || item.trang_thai === 'tu_choi') && !item.khoa_boi_doi_tac
);

const getCreatorName = (item) => {
  const nd = item.nguoi_dung;
  if (!nd) return '—';
  return (
    nd.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung?.ten_cong_ty
    || item.khach_san?.doi_tac?.ten_cong_ty
    || nd.khach_hang?.ho_ten
    || nd.email
    || '—'
  );
};

const getSourceMeta = (item) => {
  const isSystem = item.loai_nguon === 'he_thong';
  if (isSystem) {
    return {
      role: 'Admin',
      detail: item.nguoi_dung?.email || '—',
    };
  }
  return {
    role: 'Đối tác',
    detail: getCreatorName(item),
  };
};

const GiaTriCell = ({ item }) => {
  if (item.loai_giam === 'phan_tram') {
    return (
      <div className="admin-promo-value">
        <strong>{item.gia_tri}%</strong>
        {item.giam_toi_da != null && Number(item.giam_toi_da) > 0 && (
          <span className="admin-promo-value-sub">
            Tối đa {formatGiaTriShortMax(item.giam_toi_da)}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="admin-promo-value">
      <strong>{formatCurrency(item.gia_tri)} ₫</strong>
    </div>
  );
};

const UsageCell = ({ item }) => {
  const used = Number(item.so_luot_da_dung || 0);
  const max = item.so_luot_toi_da != null ? Number(item.so_luot_toi_da) : null;
  return (
    <div className="admin-promo-usage-num">
      {max != null ? `${used} / ${max}` : used}
    </div>
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

const DetailModal = ({ item, onClose, onAction, onEdit, actionLoading }) => {
  if (!item) return null;
  const st = getPromotionStatusMeta(item);
  const isSystem = item.loai_nguon === 'he_thong';
  const source = getSourceMeta(item);

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
            <InfoRow label="Giá trị giảm" value={formatGiaTri(item)} />
            {item.loai_giam === 'phan_tram' && item.giam_toi_da != null && (
              <InfoRow label="Giảm tối đa" value={`${formatCurrency(item.giam_toi_da)} ₫`} />
            )}
            <InfoRow label="Đơn tối thiểu" value={`${formatCurrency(item.don_hang_toi_thieu)} ₫`} />
            <InfoRow label="Phạm vi áp dụng" value={PHAM_VI[item.loai_nguon] || item.loai_nguon} />
            {!isSystem && <InfoRow label="Khách sạn" value={item.khach_san?.ten} />}
            <InfoRow label="Nguồn tạo" value={`${source.role} · ${source.detail}`} />
            <InfoRow
              label="Thời gian áp dụng"
              value={`${formatDate(item.ngay_bat_dau)} – ${formatDate(item.ngay_ket_thuc)}`}
            />
            <InfoRow
              label="Số lượt sử dụng"
              value={`${item.so_luot_da_dung}${item.so_luot_toi_da != null ? ` / ${item.so_luot_toi_da}` : ''}`}
            />
            {item.ly_do && <InfoRow label="Lý do" value={item.ly_do} />}
            {item.khoa_boi_admin && (
              <InfoRow label="Khóa bởi admin" value="Đối tác không thể tự mở khóa" />
            )}
            {item.khoa_boi_doi_tac && (
              <InfoRow label="Tạm ngưng bởi đối tác" value="Admin không thể mở khóa" />
            )}
            {item.thoi_gian_khoa && (
              <InfoRow label="Thời gian khóa" value={formatDate(item.thoi_gian_khoa)} />
            )}
            {item.khoa_boi?.email && (
              <InfoRow label="Admin khóa" value={item.khoa_boi.email} />
            )}
          </div>
        </div>

        <div className="user-lock-confirm-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {isSystem && (
            <ActionButton variant="edit" icon={Pencil} disabled={actionLoading} onClick={() => onEdit(item)}>
              Sửa
            </ActionButton>
          )}
          {!isSystem && item.trang_thai === 'cho_duyet' && (
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
          {canAdminRestore(item) && (
            <ActionButton variant="unlock" icon={Unlock} disabled={actionLoading} onClick={() => onAction(item, 'restore')}>
              Khôi phục
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

const FieldError = ({ msg }) => (msg ? <p className="form-field-error">{msg}</p> : null);

const inputCls = (err) => `search-input${err ? ' input-invalid' : ''}`;

const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');
const formatThousandInput = (v) => {
  const digits = onlyDigits(v);
  return digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
};

const FormModal = ({ editing, form, updateField, errors, saving, onClose, onSubmit }) => {
  const isPercent = form.loai_giam === 'phan_tram';
  const today = todayLocal();
  const minStart = today;
  const minEnd = maxDate(today, form.ngay_bat_dau);
  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()} role="presentation">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h2 className="modal-title">{editing ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi nền tảng'}</h2>
        <form onSubmit={onSubmit} noValidate>
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
                placeholder="Không bắt buộc (VD: 150.000)"
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
              placeholder="VD: 500.000"
            />
            <FieldError msg={errors.don_hang_toi_thieu} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Từ ngày</label>
              <input
                className={inputCls(errors.ngay_bat_dau)}
                type="date"
                value={form.ngay_bat_dau}
                min={minStart}
                onChange={(e) => updateField('ngay_bat_dau', e.target.value)}
              />
              <FieldError msg={errors.ngay_bat_dau} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input
                className={inputCls(errors.ngay_ket_thuc)}
                type="date"
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
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo khuyến mãi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPromotionsPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [partners, setPartners] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, showToast } = useToast();

  const [loaiGiamFilter, setLoaiGiamFilter] = useState('all');
  const [phamViFilter, setPhamViFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
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
      if (loaiGiamFilter !== 'all') params.loai_giam = loaiGiamFilter;
      if (phamViFilter !== 'all') params.loai_nguon = phamViFilter;
      if (partnerFilter) params.ma_doi_tac = partnerFilter;

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
    loaiGiamFilter, phamViFilter, partnerFilter,
    timePreset, tuNgay, denNgay, showToast,
  ]);

  useEffect(() => {
    const t = setTimeout(loadPromotions, firstLoad.current ? 0 : 300);
    return () => clearTimeout(t);
  }, [loadPromotions]);

  const handlePartnerChange = (value) => {
    setPartnerFilter(value);
    if (value && hotelFilter) {
      const stillValid = hotels.some(
        (h) => String(h.ma_khach_san) === hotelFilter && String(h.ma_doi_tac) === value,
      );
      if (!stillValid) setHotelFilter('');
    }
  };

  const clearFilters = () => {
    setLoaiGiamFilter('all');
    setPhamViFilter('all');
    setPartnerFilter('');
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
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setDetailItem(null);
    setEditing(item);
    setFormErrors({});
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
    { label: 'Bị khóa', value: stats.an ?? 0, tone: 'danger' },
  ], [stats]);

  const {
    pagedItems, currentPage, totalPages, setPage, pageNumbers, rangeFrom, rangeTo, showPagination,
  } = useListPagination(items, PAGE_SIZE, [
    loaiGiamFilter, phamViFilter, partnerFilter, timePreset, tuNgay, denNgay,
  ]);

  const confirmCfg = confirmTarget ? CONFIRM_CONFIG[confirmTarget.action] : null;

  return (
    <div className="mgmt-page admin-promotions-page">
      <ManagementHeader
        title="Quản lý khuyến mãi"
        subtitle="Toàn bộ khuyến mãi nền tảng và của đối tác trong hệ thống"
        actionLabel="Thêm khuyến mãi"
        onAction={openCreate}
      />

      <Toast toast={toast} />

      <SummaryStats items={statItems} />

      <div className="mgmt-toolbar mgmt-toolbar--filters admin-promotions-filters">
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-loaigiam">Loại khuyến mãi</label>
          <select
            id="promo-loaigiam"
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
          <label className="mgmt-filter-label" htmlFor="promo-role">Vai trò</label>
          <select
            id="promo-role"
            className="mgmt-select-inline"
            value={phamViFilter}
            onChange={(e) => setPhamViFilter(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="he_thong">Admin</option>
            <option value="doi_tac">Đối tác</option>
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-partner">Đối tác tạo</label>
          <select
            id="promo-partner"
            className="mgmt-select-inline"
            value={partnerFilter}
            onChange={(e) => handlePartnerChange(e.target.value)}
          >
            <option value="">Tất cả đối tác</option>
            {partners.map((p) => (
              <option key={p.ma_doi_tac} value={String(p.ma_doi_tac)}>{p.ten_cong_ty}</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="promo-time">Thời gian</label>
          <select
            id="promo-time"
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
              <label className="mgmt-filter-label" htmlFor="promo-from">Từ ngày</label>
              <input
                id="promo-from"
                type="date"
                className="mgmt-select-inline"
                value={tuNgay}
                onChange={(e) => setTuNgay(e.target.value)}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="promo-to">Đến ngày</label>
              <input
                id="promo-to"
                type="date"
                className="mgmt-select-inline"
                value={denNgay}
                min={tuNgay}
                onChange={(e) => setDenNgay(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="mgmt-filter-field mgmt-filter-field--action">
          <FilterActions showApply={false} onClear={clearFilters} />
        </div>
      </div>

      <div className="content-card admin-promotions-table-card">
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
              <table className="data-table data-table-grid admin-mgmt-table admin-promotions-table">
                <thead>
                  <tr>
                    <th className="admin-promo-col-code">Mã KM</th>
                    <th className="admin-promo-col-name">Tên khuyến mãi</th>
                    <th className="admin-promo-col-value">Giá trị</th>
                    <th className="admin-promo-col-source">Nguồn tạo</th>
                    <th className="admin-promo-col-dates">Thời gian</th>
                    <th className="admin-promo-col-usage">Lượt dùng</th>
                    <th className="admin-promo-col-status">Trạng thái</th>
                    <th className="admin-promo-col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
                    const st = getPromotionStatusMeta(item);
                    const isSystem = item.loai_nguon === 'he_thong';
                    const source = getSourceMeta(item);
                    return (
                      <tr key={item.ma_khuyen_mai}>
                        <td className="admin-promo-col-code"><strong>{item.ma_code}</strong></td>
                        <td className="admin-promo-col-name">{item.ten}</td>
                        <td className="admin-promo-col-value"><GiaTriCell item={item} /></td>
                        <td className="admin-promo-col-source">
                          <div className="admin-promo-source">
                            <strong>{source.role}</strong>
                            <span>{source.detail}</span>
                          </div>
                        </td>
                        <td className="admin-promo-col-dates">
                          <div className="admin-promo-dates">
                            <span>{formatDate(item.ngay_bat_dau)}</span>
                            <span className="admin-promo-dates-sep">→</span>
                            <span>{formatDate(item.ngay_ket_thuc)}</span>
                          </div>
                        </td>
                        <td className="admin-promo-col-usage"><UsageCell item={item} /></td>
                        <td className="admin-promo-col-status">
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </td>
                        <ActionCell className="admin-promo-col-actions">
                          <ActionButton variant="view" iconOnly icon={Eye} title="Chi tiết" onClick={() => setDetailItem(item)} />
                          {isSystem ? (
                            <>
                              {item.trang_thai === 'hoat_dong' && (
                                <ActionButton variant="lock" iconOnly icon={Lock} title="Tạm ngưng" onClick={() => setConfirmTarget({ item, action: 'lock' })} />
                              )}
                              <ActionButton variant="edit" iconOnly icon={Pencil} title="Sửa" onClick={() => openEdit(item)} />
                              {(item.trang_thai === 'an' || item.trang_thai === 'tu_choi') && canAdminRestore(item) && (
                                <ActionButton variant="unlock" iconOnly icon={Unlock} title="Khôi phục" onClick={() => setConfirmTarget({ item, action: 'restore' })} />
                              )}
                            </>
                          ) : (
                            <>
                              {item.trang_thai === 'cho_duyet' && (
                                <>
                                  <ActionButton variant="approve" iconOnly icon={Check} title="Duyệt" onClick={() => setConfirmTarget({ item, action: 'approve' })} />
                                  <ActionButton variant="reject" iconOnly icon={X} title="Từ chối" onClick={() => setConfirmTarget({ item, action: 'reject' })} />
                                </>
                              )}
                              {item.trang_thai === 'hoat_dong' && (
                                <ActionButton variant="lock" iconOnly icon={Lock} title="Tạm ngưng" onClick={() => setConfirmTarget({ item, action: 'lock' })} />
                              )}
                              {(item.trang_thai === 'an' || item.trang_thai === 'tu_choi') && canAdminRestore(item) && (
                                <ActionButton variant="unlock" iconOnly icon={Unlock} title="Khôi phục" onClick={() => setConfirmTarget({ item, action: 'restore' })} />
                              )}
                            </>
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
