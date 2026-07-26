import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../../services/api';
import FilterActions from '../../../../components/common/management/FilterActions';
import { formatCurrency } from '../../../../utils/bookingDisplay';
import { getPresetRange, REPORT_DATE_PRESETS, riskRateTone } from '../reportHelpers';
import { KpiCard, KpiGrid } from './ReportUI';

const SUB_TABS = [
  { id: 'doanh_thu', label: 'Doanh thu' },
  { id: 'hoan_tien', label: 'Hoàn tiền' },
];

const REVENUE_SORT_OPTIONS = [
  { value: 'doanh_thu_desc', label: 'Doanh thu ↓' },
  { value: 'doanh_thu_asc', label: 'Doanh thu ↑' },
  { value: 'hoa_hong_desc', label: 'Hoa hồng ↓' },
  { value: 'booking_desc', label: 'Booking ↓' },
  { value: 'booking_asc', label: 'Booking ↑' },
  { value: 'partner_asc', label: 'Đối tác A–Z' },
  { value: 'hotel_asc', label: 'Khách sạn A–Z' },
];

const REFUND_SORT_OPTIONS = [
  { value: 'tien_hoan_desc', label: 'Tiền hoàn ↓' },
  { value: 'tien_hoan_asc', label: 'Tiền hoàn ↑' },
  { value: 'don_hoan_desc', label: 'Đơn hoàn ↓' },
  { value: 'ty_le_desc', label: 'Tỉ lệ hoàn ↓' },
  { value: 'partner_asc', label: 'Đối tác A–Z' },
  { value: 'hotel_asc', label: 'Khách sạn A–Z' },
];

const emptyDraft = () => {
  const range = getPresetRange('month');
  return {
    preset: 'month',
    tu_ngay: range.tu_ngay,
    den_ngay: range.den_ngay,
    ma_doi_tac: '',
    ma_khach_san: '',
    thanh_pho: '',
  };
};

const sortRevenueRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'doanh_thu_asc':
      return list.sort((a, b) => a.doanh_thu - b.doanh_thu);
    case 'hoa_hong_desc':
      return list.sort((a, b) => (b.hoa_hong || 0) - (a.hoa_hong || 0));
    case 'booking_desc':
      return list.sort((a, b) => b.so_don - a.so_don);
    case 'booking_asc':
      return list.sort((a, b) => a.so_don - b.so_don);
    case 'partner_asc':
      return list.sort((a, b) => (a.ten_doi_tac || '').localeCompare(b.ten_doi_tac || '', 'vi'));
    case 'hotel_asc':
      return list.sort((a, b) => (a.ten_khach_san || '').localeCompare(b.ten_khach_san || '', 'vi'));
    case 'doanh_thu_desc':
    default:
      return list.sort((a, b) => b.doanh_thu - a.doanh_thu);
  }
};

const sortRefundRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'tien_hoan_asc':
      return list.sort((a, b) => a.tien_hoan - b.tien_hoan);
    case 'don_hoan_desc':
      return list.sort((a, b) => b.so_don_hoan - a.so_don_hoan);
    case 'ty_le_desc':
      return list.sort((a, b) => b.ty_le_hoan - a.ty_le_hoan);
    case 'partner_asc':
      return list.sort((a, b) => (a.ten_doi_tac || '').localeCompare(b.ten_doi_tac || '', 'vi'));
    case 'hotel_asc':
      return list.sort((a, b) => (a.ten_khach_san || '').localeCompare(b.ten_khach_san || '', 'vi'));
    case 'tien_hoan_desc':
    default:
      return list.sort((a, b) => b.tien_hoan - a.tien_hoan);
  }
};

const ReportFinancePanel = () => {
  const [subTab, setSubTab] = useState('doanh_thu');
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('doanh_thu_desc');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (filters) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        tu_ngay: filters.tu_ngay || undefined,
        den_ngay: filters.den_ngay || undefined,
      };
      if (filters.ma_doi_tac) params.ma_doi_tac = filters.ma_doi_tac;
      if (filters.ma_khach_san) params.ma_khach_san = filters.ma_khach_san;
      if (filters.thanh_pho) params.thanh_pho = filters.thanh_pho;

      const res = await api.get('/admin/analytics/finance', { params });
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Không tải được dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(applied);
  }, [applied, loadData]);

  useEffect(() => {
    setSort(subTab === 'doanh_thu' ? 'doanh_thu_desc' : 'tien_hoan_desc');
    setSearch('');
  }, [subTab]);

  const filterOptions = data?.filters || {};
  const partners = filterOptions.doi_tac || [];
  const hotels = filterOptions.khach_san || [];
  const cities = filterOptions.thanh_pho || [];
  const revenueKpis = data?.doanh_thu?.kpis || {};
  const refundKpis = data?.hoan_tien?.kpis || {};

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (draft.ma_doi_tac && String(h.ma_doi_tac) !== String(draft.ma_doi_tac)) return false;
      if (draft.thanh_pho && h.thanh_pho !== draft.thanh_pho) return false;
      return true;
    });
  }, [hotels, draft.ma_doi_tac, draft.thanh_pho]);

  const updateDraft = (patch) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
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

  const revenueRows = useMemo(() => {
    const rows = data?.doanh_thu?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (r) =>
            (r.ten_doi_tac || '').toLowerCase().includes(keyword) ||
            (r.ten_khach_san || '').toLowerCase().includes(keyword) ||
            (r.thanh_pho || '').toLowerCase().includes(keyword)
        )
      : rows;
    return sortRevenueRows(filtered, sort);
  }, [data, search, sort]);

  const refundRows = useMemo(() => {
    const rows = data?.hoan_tien?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (r) =>
            (r.ten_khach_san || '').toLowerCase().includes(keyword) ||
            (r.ten_doi_tac || '').toLowerCase().includes(keyword)
        )
      : rows;
    return sortRefundRows(filtered, sort);
  }, [data, search, sort]);

  return (
    <div className="admin-reports-panel admin-reports-finance">
      <nav className="admin-reports-subtabs" aria-label="Nhóm tài chính">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-reports-subtab${subTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="admin-reports-finance-kpis">
        {subTab === 'doanh_thu' ? (
          <KpiGrid cols={3}>
            <KpiCard
              title="Tổng doanh thu"
              value={formatCurrency(revenueKpis.tong_doanh_thu)}
              tone="success"
            />
            <KpiCard
              title="Tổng hoa hồng thu về"
              value={formatCurrency(revenueKpis.tong_hoa_hong)}
              tone="warning"
            />
            <KpiCard
              title="Số lượng Booking thành công"
              value={revenueKpis.so_booking_thanh_cong ?? 0}
              tone="info"
            />
          </KpiGrid>
        ) : (
          <KpiGrid cols={3}>
            <KpiCard
              title="Tổng tiền đã hoàn"
              value={formatCurrency(refundKpis.tong_tien_hoan)}
              tone="danger"
            />
            <KpiCard
              title="Tỉ lệ hoàn trung bình"
              value={`${refundKpis.ty_le_hoan_tb ?? 0}%`}
              tone="warning"
            />
            <KpiCard
              title="Số lượng đơn hoàn"
              value={refundKpis.so_don_hoan ?? 0}
              tone="info"
            />
          </KpiGrid>
        )}
      </div>

      <div className="admin-reports-finance-filters">
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="finance-preset">Thời gian</label>
          <select
            id="finance-preset"
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
              <label htmlFor="finance-from">Từ ngày</label>
              <input
                id="finance-from"
                type="date"
                value={draft.tu_ngay}
                onChange={(e) => updateDraft({ tu_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
            <div className="admin-reports-finance-filter-field">
              <label htmlFor="finance-to">Đến ngày</label>
              <input
                id="finance-to"
                type="date"
                value={draft.den_ngay}
                min={draft.tu_ngay}
                onChange={(e) => updateDraft({ den_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
          </>
        ) : null}

        <div className="admin-reports-finance-filter-field">
          <label htmlFor="finance-partner">Đối tác</label>
          <select
            id="finance-partner"
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

        <div className="admin-reports-finance-filter-field">
          <label htmlFor="finance-hotel">Khách sạn</label>
          <select
            id="finance-hotel"
            value={draft.ma_khach_san}
            onChange={(e) => updateDraft({ ma_khach_san: e.target.value })}
          >
            <option value="">Tất cả khách sạn</option>
            {filteredHotels.map((h) => (
              <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
            ))}
          </select>
        </div>

        <div className="admin-reports-finance-filter-field">
          <label htmlFor="finance-city">Thành phố</label>
          <select
            id="finance-city"
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

        <div className="admin-reports-finance-filter-actions">
          <FilterActions onClear={clearFilters} />
        </div>
      </div>

      <div className="admin-reports-finance-toolbar">
        <div className="admin-reports-finance-filter-field admin-reports-finance-search">
          <label htmlFor="finance-search">Tìm kiếm</label>
          <input
            id="finance-search"
            type="search"
            placeholder="Tìm đối tác, khách sạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="finance-sort">Sắp xếp</label>
          <select
            id="finance-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {(subTab === 'doanh_thu' ? REVENUE_SORT_OPTIONS : REFUND_SORT_OPTIONS).map((opt) => (
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
          {subTab === 'doanh_thu' ? (
            revenueRows.length === 0 ? (
              <p className="admin-reports-rank-empty">Không có dữ liệu doanh thu</p>
            ) : (
              <div className="admin-reports-table-wrap">
                <table className="data-table admin-reports-table">
                  <thead>
                    <tr>
                      <th className="is-name">Đối tác</th>
                      <th className="is-name">Khách sạn</th>
                      <th className="is-money">Booking</th>
                      <th className="is-money">Doanh thu</th>
                      <th className="is-money">Hoa hồng hệ thống</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRows.map((row) => (
                      <tr key={row.ma_khach_san}>
                        <td className="is-name">{row.ten_doi_tac || '—'}</td>
                        <td className="is-name">{row.ten_khach_san || '—'}</td>
                        <td className="is-money">{row.so_don}</td>
                        <td className="is-money">{formatCurrency(row.doanh_thu)}</td>
                        <td className="is-money admin-reports-commission">
                          {formatCurrency(row.hoa_hong)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : refundRows.length === 0 ? (
            <p className="admin-reports-rank-empty">Không có dữ liệu hoàn tiền</p>
          ) : (
            <div className="admin-reports-table-wrap">
              <table className="data-table admin-reports-table">
                <thead>
                  <tr>
                    <th className="is-name">Đối tác</th>
                    <th className="is-name">Khách sạn</th>
                    <th className="is-money">Đơn hoàn</th>
                    <th className="is-money">Tiền hoàn</th>
                    <th className="is-money">Tỉ lệ hoàn</th>
                  </tr>
                </thead>
                <tbody>
                  {refundRows.map((row) => (
                    <tr key={row.ma_khach_san}>
                      <td className="is-name">{row.ten_doi_tac || '—'}</td>
                      <td className="is-name">{row.ten_khach_san || '—'}</td>
                      <td className="is-money">{row.so_don_hoan}</td>
                      <td className="is-money">{formatCurrency(row.tien_hoan)}</td>
                      <td className="is-money">
                        <span
                          className={`admin-reports-rate-badge is-${riskRateTone(row.ty_le_hoan)}`}
                        >
                          {row.ty_le_hoan}%
                        </span>
                      </td>
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

export default ReportFinancePanel;
