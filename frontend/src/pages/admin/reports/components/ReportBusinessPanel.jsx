import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../../services/api';
import DateInput from '../../../../components/common/DateInput';
import FilterActions from '../../../../components/common/management/FilterActions';
import ListPagination from '../../../../components/common/management/ListPagination';
import useListPagination from '../../../../hooks/useListPagination';
import { getPresetRange, REPORT_DATE_PRESETS, riskRateTone } from '../reportHelpers';
import { KpiCard, KpiGrid } from './ReportUI';

const PAGE_SIZE = 10;

const SUB_TABS = [
  { id: 'dat_phong', label: 'Đặt phòng' },
  { id: 'danh_gia', label: 'Đánh giá' },
];

const BOOKING_SORT_OPTIONS = [
  { value: 'tong_desc', label: 'Tổng booking ↓' },
  { value: 'tong_asc', label: 'Tổng booking ↑' },
  { value: 'success_desc', label: 'Thành công ↓' },
  { value: 'cancel_desc', label: 'Tỉ lệ hủy ↓' },
  { value: 'partner_asc', label: 'Đối tác A–Z' },
  { value: 'hotel_asc', label: 'Khách sạn A–Z' },
];

const REVIEW_SORT_OPTIONS = [
  { value: 'score_desc', label: 'Điểm TB ↓' },
  { value: 'score_asc', label: 'Điểm TB ↑' },
  { value: 'count_desc', label: 'Lượt đánh giá ↓' },
  { value: 'partner_asc', label: 'Đối tác A–Z' },
  { value: 'hotel_asc', label: 'Khách sạn A–Z' },
];

const STAR_OPTIONS = [
  { value: '', label: 'Tất cả sao' },
  { value: '5', label: '5 sao' },
  { value: '4', label: '4 sao' },
  { value: '3', label: '3 sao' },
  { value: '2', label: '2 sao' },
  { value: '1', label: '1 sao' },
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
    so_sao: '',
  };
};

const sortBookingRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'tong_asc':
      return list.sort((a, b) => a.tong_booking - b.tong_booking);
    case 'success_desc':
      return list.sort((a, b) => b.thanh_cong - a.thanh_cong);
    case 'cancel_desc':
      return list.sort((a, b) => b.ty_le_huy - a.ty_le_huy);
    case 'partner_asc':
      return list.sort((a, b) => (a.ten_doi_tac || '').localeCompare(b.ten_doi_tac || '', 'vi'));
    case 'hotel_asc':
      return list.sort((a, b) => (a.ten_khach_san || '').localeCompare(b.ten_khach_san || '', 'vi'));
    case 'tong_desc':
    default:
      return list.sort((a, b) => b.tong_booking - a.tong_booking);
  }
};

const sortReviewRows = (rows, sort) => {
  const list = [...rows];
  switch (sort) {
    case 'score_asc':
      return list.sort((a, b) => a.diem_trung_binh - b.diem_trung_binh);
    case 'count_desc':
      return list.sort((a, b) => b.luot_danh_gia - a.luot_danh_gia);
    case 'partner_asc':
      return list.sort((a, b) => (a.ten_doi_tac || '').localeCompare(b.ten_doi_tac || '', 'vi'));
    case 'hotel_asc':
      return list.sort((a, b) => (a.ten_khach_san || '').localeCompare(b.ten_khach_san || '', 'vi'));
    case 'score_desc':
    default:
      return list.sort(
        (a, b) =>
          b.diem_trung_binh - a.diem_trung_binh || b.luot_danh_gia - a.luot_danh_gia
      );
  }
};

const ReportBusinessPanel = () => {
  const [subTab, setSubTab] = useState('dat_phong');
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('tong_desc');
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
      if (filters.so_sao) params.so_sao = filters.so_sao;

      const res = await api.get('/admin/analytics/business', { params });
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Không tải được dữ liệu kinh doanh');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(applied);
  }, [applied, loadData]);

  useEffect(() => {
    setSort(subTab === 'dat_phong' ? 'tong_desc' : 'score_desc');
    setSearch('');
  }, [subTab]);

  const filterOptions = data?.filters || {};
  const partners = filterOptions.doi_tac || [];
  const hotels = filterOptions.khach_san || [];
  const cities = filterOptions.thanh_pho || [];
  const bookingKpis = data?.dat_phong?.kpis || {};
  const reviewKpis = data?.danh_gia?.kpis || {};

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

  const bookingRows = useMemo(() => {
    const rows = data?.dat_phong?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (r) =>
            (r.ten_doi_tac || '').toLowerCase().includes(keyword) ||
            (r.ten_khach_san || '').toLowerCase().includes(keyword)
        )
      : rows;
    return sortBookingRows(filtered, sort);
  }, [data, search, sort]);

  const reviewRows = useMemo(() => {
    const rows = data?.danh_gia?.rows || [];
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (r) =>
            (r.ten_doi_tac || '').toLowerCase().includes(keyword) ||
            (r.ten_khach_san || '').toLowerCase().includes(keyword)
        )
      : rows;
    return sortReviewRows(filtered, sort);
  }, [data, search, sort]);

  const activeRows = subTab === 'dat_phong' ? bookingRows : reviewRows;
  const {
    pagedItems,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(activeRows, PAGE_SIZE, [subTab, search, sort, applied]);

  return (
    <div className="admin-reports-panel admin-reports-business">
      <nav className="admin-reports-subtabs" aria-label="Nhóm kinh doanh">
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
        {subTab === 'dat_phong' ? (
          <KpiGrid cols={3}>
            <KpiCard
              title="Tổng lượt Booking toàn sàn"
              value={bookingKpis.tong_booking ?? 0}
              tone="info"
            />
            <KpiCard
              title="Tỉ lệ lấp đầy"
              value={`${bookingKpis.ty_le_lap_day ?? 0}%`}
              tone="success"
            />
            <KpiCard
              title="Tỉ lệ hủy trung bình"
              value={`${bookingKpis.ty_le_huy_tb ?? 0}%`}
              tone="danger"
            />
          </KpiGrid>
        ) : (
          <KpiGrid cols={2}>
            <KpiCard
              title="Điểm hài lòng trung bình toàn sàn"
              value={reviewKpis.diem_hai_long_tb ?? 0}
              tone="warning"
            />
            <KpiCard
              title="Tổng lượt đánh giá trong tháng"
              value={reviewKpis.tong_luot_danh_gia ?? 0}
              tone="info"
            />
          </KpiGrid>
        )}
      </div>

      <div className="admin-reports-finance-filters">
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="business-preset">Thời gian</label>
          <select
            id="business-preset"
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
              <label htmlFor="business-from">Từ ngày</label>
              <DateInput
                id="business-from"
                value={draft.tu_ngay}
                onChange={(e) => updateDraft({ tu_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
            <div className="admin-reports-finance-filter-field">
              <label htmlFor="business-to">Đến ngày</label>
              <DateInput
                id="business-to"
                value={draft.den_ngay}
                min={draft.tu_ngay}
                onChange={(e) => updateDraft({ den_ngay: e.target.value, preset: 'custom' })}
              />
            </div>
          </>
        ) : null}

        <div className="admin-reports-finance-filter-field">
          <label htmlFor="business-partner">Đối tác</label>
          <select
            id="business-partner"
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
          <label htmlFor="business-hotel">Khách sạn</label>
          <select
            id="business-hotel"
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
          <label htmlFor="business-city">Thành phố</label>
          <select
            id="business-city"
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

        {subTab === 'danh_gia' ? (
          <div className="admin-reports-finance-filter-field">
            <label htmlFor="business-star">Sao</label>
            <select
              id="business-star"
              value={draft.so_sao}
              onChange={(e) => updateDraft({ so_sao: e.target.value })}
            >
              {STAR_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
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
          <label htmlFor="business-search">Tìm kiếm</label>
          <input
            id="business-search"
            type="search"
            placeholder="Tìm đối tác, khách sạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-reports-finance-filter-field">
          <label htmlFor="business-sort">Sắp xếp</label>
          <select
            id="business-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {(subTab === 'dat_phong' ? BOOKING_SORT_OPTIONS : REVIEW_SORT_OPTIONS).map((opt) => (
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
          {subTab === 'dat_phong' ? (
            bookingRows.length === 0 ? (
              <p className="admin-reports-rank-empty">Không có dữ liệu đặt phòng</p>
            ) : (
              <div className="admin-reports-table-wrap">
                <table className="data-table admin-reports-table">
                  <thead>
                    <tr>
                      <th className="is-name">Đối tác</th>
                      <th className="is-name">Khách sạn</th>
                      <th className="is-money">Tổng booking</th>
                      <th className="is-money">Thành công</th>
                      <th className="is-money">Bị hủy</th>
                      <th className="is-money">Tỉ lệ hủy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((row) => (
                      <tr key={row.ma_khach_san}>
                        <td className="is-name">{row.ten_doi_tac || '—'}</td>
                        <td className="is-name">{row.ten_khach_san || '—'}</td>
                        <td className="is-money">{row.tong_booking}</td>
                        <td className="is-money">{row.thanh_cong}</td>
                        <td className="is-money">{row.da_huy}</td>
                        <td className="is-money">
                          <span
                            className={`admin-reports-rate-badge is-${riskRateTone(row.ty_le_huy)}`}
                          >
                            {row.ty_le_huy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showPagination && (
                  <ListPagination
                    total={bookingRows.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rangeFrom={rangeFrom}
                    rangeTo={rangeTo}
                    pageNumbers={pageNumbers}
                    onPageChange={setPage}
                  />
                )}
              </div>
            )
          ) : reviewRows.length === 0 ? (
            <p className="admin-reports-rank-empty">Không có dữ liệu đánh giá</p>
          ) : (
            <div className="admin-reports-table-wrap">
              <table className="data-table admin-reports-table">
                <thead>
                  <tr>
                    <th className="is-name">Đối tác</th>
                    <th className="is-name">Khách sạn</th>
                    <th className="is-money">Điểm TB</th>
                    <th className="is-money">Lượt đánh giá</th>
                    <th className="is-money">5★</th>
                    <th className="is-money">4★</th>
                    <th className="is-money">3★</th>
                    <th className="is-money">2★</th>
                    <th className="is-money">1★</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((row) => (
                    <tr key={row.ma_khach_san}>
                      <td className="is-name">{row.ten_doi_tac || '—'}</td>
                      <td className="is-name">{row.ten_khach_san || '—'}</td>
                      <td className="is-money">{row.diem_trung_binh}</td>
                      <td className="is-money">{row.luot_danh_gia}</td>
                      <td className="is-money">{row.sao_5 ?? 0}</td>
                      <td className="is-money">{row.sao_4 ?? 0}</td>
                      <td className="is-money">{row.sao_3 ?? 0}</td>
                      <td className="is-money">{row.sao_2 ?? 0}</td>
                      <td className="is-money">{row.sao_1 ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showPagination && (
                <ListPagination
                  total={reviewRows.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  rangeFrom={rangeFrom}
                  rangeTo={rangeTo}
                  pageNumbers={pageNumbers}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportBusinessPanel;
