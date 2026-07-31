import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../../services/api';
import FilterActions from '../../../../components/common/management/FilterActions';
import { formatCurrency } from '../../../../utils/bookingDisplay';
import {
  ACCOUNT_BADGE,
} from '../../../../constants/statusConfig';
import { getPresetRange, REPORT_DATE_PRESETS } from '../reportHelpers';

const ROLE_OPTIONS = [
  { value: 'doi_tac', label: 'Đối tác' },
  { value: 'khach_hang', label: 'Khách hàng' },
];

const formatCustomerOptionLabel = (customer) => {
  const name = customer?.ten || `KH #${customer?.ma_khach_hang || ''}`;
  const detail = customer?.email || customer?.so_dien_thoai;
  return detail ? `${name} — ${detail}` : name;
};

const PARTNER_SORT_OPTIONS = [
  { value: 'revenue_desc', label: 'Doanh thu ↓' },
  { value: 'don_desc', label: 'Số đơn ↓' },
  { value: 'hotel_desc', label: 'Số KS ↓' },
  { value: 'partner_asc', label: 'Đối tác A–Z' },
];

const CUSTOMER_SORT_OPTIONS = [
  { value: 'spend_desc', label: 'Chi tiêu ↓' },
  { value: 'don_desc', label: 'Số đơn ↓' },
  { value: 'last_booking_desc', label: 'Lần cuối đặt ↓' },
  { value: 'name_asc', label: 'Tên A–Z' },
  { value: 'date_desc', label: 'Ngày đăng ký ↓' },
];

const emptyDraft = () => {
  const range = getPresetRange('month');
  return {
    preset: 'month',
    tu_ngay: range.tu_ngay,
    den_ngay: range.den_ngay,
    vai_tro: 'doi_tac',
    ma_doi_tac: '',
    ma_khach_san: '',
    ma_khach_hang: '',
    thanh_pho: '',
  };
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
};

const statusBadge = (map, key) => {
  const meta = map[key] || { label: key || '—', cls: 'badge-default' };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
};

const sortPartnerRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'don_desc':
      return list.sort((a, b) => b.so_don - a.so_don);
    case 'hotel_desc':
      return list.sort((a, b) => b.so_khach_san - a.so_khach_san);
    case 'partner_asc':
      return list.sort((a, b) => (a.ten_doi_tac || '').localeCompare(b.ten_doi_tac || '', 'vi'));
    case 'revenue_desc':
    default:
      return list.sort((a, b) => b.doanh_thu - a.doanh_thu);
  }
};

const sortCustomerRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'don_desc':
      return list.sort((a, b) => b.tong_don - a.tong_don);
    case 'last_booking_desc':
      return list.sort(
        (a, b) => new Date(b.lan_cuoi_dat || 0) - new Date(a.lan_cuoi_dat || 0)
      );
    case 'name_asc':
      return list.sort((a, b) => (a.ten_khach_hang || '').localeCompare(b.ten_khach_hang || '', 'vi'));
    case 'date_desc':
      return list.sort(
        (a, b) => new Date(b.ngay_dang_ky || 0) - new Date(a.ngay_dang_ky || 0)
      );
    case 'spend_desc':
    default:
      return list.sort((a, b) => b.tong_chi_tieu - a.tong_chi_tieu);
  }
};

const ReportSystemPanel = () => {
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('don_desc');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const vaiTro = applied.vai_tro || 'doi_tac';
  const showPartnerFilter = vaiTro === 'doi_tac';
  const showCityFilter = vaiTro === 'doi_tac';
  const showCustomerFilter = vaiTro === 'khach_hang';

  const loadData = useCallback(async (filters) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        tu_ngay: filters.tu_ngay || undefined,
        den_ngay: filters.den_ngay || undefined,
      };
      if (filters.vai_tro === 'khach_hang') {
        if (filters.ma_khach_hang) params.ma_khach_hang = filters.ma_khach_hang;
      } else {
        if (filters.ma_doi_tac) params.ma_doi_tac = filters.ma_doi_tac;
        if (filters.thanh_pho) params.thanh_pho = filters.thanh_pho;
      }

      const res = await api.get('/admin/analytics/system', { params });
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Không tải được dữ liệu hệ thống');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(applied);
  }, [applied, loadData]);

  useEffect(() => {
    if (vaiTro === 'doi_tac') setSort('revenue_desc');
    else setSort('spend_desc');
    setSearch('');
  }, [vaiTro]);

  const filterOptions = data?.filters || {};
  const partners = filterOptions.doi_tac || [];
  const customers = filterOptions.khach_hang || [];
  const cities = filterOptions.thanh_pho || [];

  const updateDraft = (patch) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      setApplied(next);
      return next;
    });
  };

  const handleRoleChange = (nextRole) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        vai_tro: nextRole,
        ma_doi_tac: nextRole === 'doi_tac' ? prev.ma_doi_tac : '',
        ma_khach_san: '',
        ma_khach_hang: nextRole === 'khach_hang' ? prev.ma_khach_hang : '',
        thanh_pho: nextRole === 'doi_tac' ? prev.thanh_pho : '',
      };
      setApplied(next);
      return next;
    });
  };

  const handlePresetChange = (preset) => {
    if (preset === 'custom') {
      updateDraft({ preset });
      return;
    }
    const range = getPresetRange(preset);
    updateDraft({
      preset,
      tu_ngay: range.tu_ngay,
      den_ngay: range.den_ngay,
    });
  };

  const clearFilters = () => {
    const next = emptyDraft();
    setDraft(next);
    setApplied(next);
    setSearch('');
  };

  const partnerRows = useMemo(() => {
    const rows = data?.doi_tac?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter((r) => (r.ten_doi_tac || '').toLowerCase().includes(keyword))
      : rows;
    return sortPartnerRows(filtered, sort);
  }, [data, search, sort]);

  const customerRows = useMemo(() => {
    const rows = data?.khach_hang?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (r) =>
            (r.ten_khach_hang || '').toLowerCase().includes(keyword) ||
            (r.email || '').toLowerCase().includes(keyword) ||
            (r.so_dien_thoai || '').toLowerCase().includes(keyword)
        )
      : rows;
    return sortCustomerRows(filtered, sort);
  }, [data, search, sort]);

  const sortOptions =
    vaiTro === 'doi_tac'
      ? PARTNER_SORT_OPTIONS
      : CUSTOMER_SORT_OPTIONS;

  return (
    <div className="admin-reports-panel admin-reports-system">
      <div className="admin-reports-finance-filters">
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="system-role">Vai trò</label>
          <select
            id="system-role"
            value={draft.vai_tro}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-reports-finance-filter-field">
          <label htmlFor="system-preset">Thời gian</label>
          <select
            id="system-preset"
            value={draft.preset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            {REPORT_DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {draft.preset === 'custom' ? (
          <>
            <div className="admin-reports-finance-filter-field">
              <label htmlFor="system-from">Từ ngày</label>
              <input
                id="system-from"
                type="date"
                value={draft.tu_ngay}
                onChange={(e) => updateDraft({ tu_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
            <div className="admin-reports-finance-filter-field">
              <label htmlFor="system-to">Đến ngày</label>
              <input
                id="system-to"
                type="date"
                value={draft.den_ngay}
                min={draft.tu_ngay}
                onChange={(e) => updateDraft({ den_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
          </>
        ) : null}

        {showCityFilter ? (
          <div className="admin-reports-finance-filter-field">
            <label htmlFor="system-city">Thành phố</label>
            <select
              id="system-city"
              value={draft.thanh_pho}
              onChange={(e) =>
                updateDraft({
                  thanh_pho: e.target.value,
                  ma_khach_san: '',
                })
              }
            >
              <option value="">Tất cả thành phố</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        ) : null}

        {showPartnerFilter ? (
          <div className="admin-reports-finance-filter-field">
            <label htmlFor="system-partner">Đối tác</label>
            <select
              id="system-partner"
              value={draft.ma_doi_tac}
              onChange={(e) =>
                updateDraft({
                  ma_doi_tac: e.target.value,
                  ma_khach_san: '',
                })
              }
            >
              <option value="">Tất cả đối tác</option>
              {partners.map((p) => (
                <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten}</option>
              ))}
            </select>
          </div>
        ) : null}

        {showCustomerFilter ? (
          <div className="admin-reports-finance-filter-field">
            <label htmlFor="system-customer">Khách hàng</label>
            <select
              id="system-customer"
              value={draft.ma_khach_hang}
              onChange={(e) => updateDraft({ ma_khach_hang: e.target.value })}
            >
              <option value="">Tất cả khách hàng</option>
              {customers.map((c) => (
                <option key={c.ma_khach_hang} value={c.ma_khach_hang}>
                  {formatCustomerOptionLabel(c)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="admin-reports-finance-filter-actions">
          <FilterActions onClear={clearFilters} />
        </div>
      </div>

      <div className="admin-reports-finance-toolbar">
        <div className="admin-reports-finance-filter-field admin-reports-finance-search">
          <label htmlFor="system-search">Tìm kiếm</label>
          <input
            id="system-search"
            type="search"
            placeholder={
              vaiTro === 'khach_hang'
                ? 'Tìm tên, email, SĐT...'
                : 'Tìm đối tác...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="system-sort">Sắp xếp</label>
          <select
            id="system-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-reports-loading">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="admin-reports-error">{error}</div>
      ) : (
        <div className="admin-reports-table-block">
          {vaiTro === 'doi_tac' ? (
            partnerRows.length === 0 ? (
              <p className="admin-reports-rank-empty">Không có dữ liệu đối tác</p>
            ) : (
              <div className="admin-reports-table-wrap">
                <table className="data-table admin-reports-table">
                  <thead>
                    <tr>
                      <th className="is-name">Đối tác</th>
                      <th className="is-money">Số khách sạn</th>
                      <th className="is-money">Số đơn đặt</th>
                      <th className="is-money">Doanh thu</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerRows.map((row) => (
                      <tr key={row.ma_doi_tac}>
                        <td className="is-name">{row.ten_doi_tac || '—'}</td>
                        <td className="is-money">{row.so_khach_san}</td>
                        <td className="is-money">{row.so_don}</td>
                        <td className="is-money">{formatCurrency(row.doanh_thu)}</td>
                        <td>{statusBadge(ACCOUNT_BADGE, row.trang_thai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : customerRows.length === 0 ? (
            <p className="admin-reports-rank-empty">Không có dữ liệu khách hàng</p>
          ) : (
            <div className="admin-reports-table-wrap">
              <table className="data-table admin-reports-table">
                <thead>
                  <tr>
                    <th className="is-name">Khách hàng</th>
                    <th>Email</th>
                    <th>Ngày đăng ký</th>
                    <th>Lần cuối đặt phòng</th>
                    <th className="is-money">Tổng đơn đặt</th>
                    <th className="is-money">Tổng chi tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {customerRows.map((row) => (
                    <tr key={row.ma_khach_hang}>
                      <td className="is-name">{row.ten_khach_hang || '—'}</td>
                      <td>{row.email || '—'}</td>
                      <td>{formatDate(row.ngay_dang_ky)}</td>
                      <td>{formatDate(row.lan_cuoi_dat)}</td>
                      <td className="is-money">{row.tong_don}</td>
                      <td className="is-money">{formatCurrency(row.tong_chi_tieu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportSystemPanel;
