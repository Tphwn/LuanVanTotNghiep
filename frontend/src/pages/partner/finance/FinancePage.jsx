import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterActions from '../../../components/common/management/FilterActions';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import FinanceOverviewPanel from './FinanceOverviewPanel';
import {
  PARTNER_TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../../utils/bookingDisplay';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'revenue', label: 'Doanh thu' },
  { id: 'commission', label: 'Hoa hồng' },
  { id: 'payout', label: 'Thanh toán' },
];

const COMMISSION_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'mgmt-status-text--pending' },
  da_thu: { label: 'Đã đối soát', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--info' },
};

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'mgmt-status-text--pending' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'mgmt-status-text--active' },
  tam_giu: { label: 'Tạm giữ', cls: 'mgmt-status-text--danger' },
};

/** yyyy-mm-dd → dd/mm/yyyy */
const toDisplayDate = (value) => {
  if (!value) return '';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

/** Parse dd/mm/yyyy → yyyy-mm-dd; '' nếu trống; null nếu không hợp lệ */
const parseDisplayDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const StatCard = ({ title, value, subtitle, tone }) => (
  <div className={`admin-finance-metric${tone ? ` admin-finance-metric--${tone}` : ''}`}>
    <span className="admin-finance-metric-label">{title}</span>
    <strong className="admin-finance-metric-value">{formatCurrency(value)}</strong>
    <span className={`admin-finance-metric-sub${subtitle ? '' : ' is-empty'}`}>
      {subtitle || '\u00A0'}
    </span>
  </div>
);

const FinancePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';
  const [hotels, setHotels] = useState([]);
  const [draftHotel, setDraftHotel] = useState('all');
  const [draftTuNgayText, setDraftTuNgayText] = useState('');
  const [draftDenNgayText, setDraftDenNgayText] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailBookingId, setDetailBookingId] = useState(null);

  const [cards, setCards] = useState({
    tong_doanh_thu: 0,
    hoa_hong: 0,
    tien_doi_tac_nhan: 0,
    cho_thanh_toan: 0,
    da_thanh_toan: 0,
  });
  const [charts, setCharts] = useState({
    revenue_trend: [],
    commission_split: [],
    revenue_by_hotel: [],
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [revenueRows, setRevenueRows] = useState([]);
  const [commissionRows, setCommissionRows] = useState([]);
  const [payoutRows, setPayoutRows] = useState([]);

  const handleTabChange = (nextTab) => {
    setSearchParams(nextTab === 'overview' ? {} : { tab: nextTab });
  };


  const queryParams = useMemo(() => {
    const params = {};
    if (hotelFilter !== 'all') params.ma_khach_san = hotelFilter;
    if (tuNgay) params.tu_ngay = tuNgay;
    if (denNgay) params.den_ngay = denNgay;
    return params;
  }, [hotelFilter, tuNgay, denNgay]);

  useEffect(() => {
    api.get('/partner/finance/hotels')
      .then((res) => setHotels(res.data.data || []))
      .catch(() => setHotels([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const overviewRes = await api.get('/partner/finance/overview', { params: queryParams });
        if (cancelled) return;
        const overviewData = overviewRes.data.data || {};
        setCards(overviewData.cards || {});
        setCharts(overviewData.charts || {
          revenue_trend: [],
          commission_split: [],
          revenue_by_hotel: [],
        });
        setRecentPayments(overviewData.recent_payments || []);

        if (tab === 'revenue') {
          const res = await api.get('/partner/finance/revenue', { params: queryParams });
          if (!cancelled) setRevenueRows(res.data.data || []);
        } else if (tab === 'commission') {
          const res = await api.get('/partner/finance/commissions', { params: queryParams });
          if (!cancelled) setCommissionRows(res.data.data || []);
        } else if (tab === 'payout') {
          const res = await api.get('/partner/finance/payouts', { params: queryParams });
          if (!cancelled) setPayoutRows(res.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không tải được dữ liệu tài chính');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [queryParams, tab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const overviewRes = await api.get('/partner/finance/overview', { params: queryParams });
      const overviewData = overviewRes.data.data || {};
      setCards(overviewData.cards || {});
      setCharts(overviewData.charts || {
        revenue_trend: [],
        commission_split: [],
        revenue_by_hotel: [],
      });
      setRecentPayments(overviewData.recent_payments || []);

      if (tab === 'revenue') {
        const res = await api.get('/partner/finance/revenue', { params: queryParams });
        setRevenueRows(res.data.data || []);
      } else if (tab === 'commission') {
        const res = await api.get('/partner/finance/commissions', { params: queryParams });
        setCommissionRows(res.data.data || []);
      } else if (tab === 'payout') {
        const res = await api.get('/partner/finance/payouts', { params: queryParams });
        setPayoutRows(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  }, [queryParams, tab]);
  const {
    pagedItems: pagedRevenue,
    currentPage: revenuePage,
    totalPages: revenuePages,
    setPage: setRevenuePage,
    pageNumbers: revenuePageNumbers,
    rangeFrom: revenueFrom,
    rangeTo: revenueTo,
    showPagination: showRevenuePaging,
  } = useListPagination(revenueRows, 10, [revenueRows, queryParams]);

  const {
    pagedItems: pagedCommissions,
    currentPage: commissionPage,
    totalPages: commissionPages,
    setPage: setCommissionPage,
    pageNumbers: commissionPageNumbers,
    rangeFrom: commissionFrom,
    rangeTo: commissionTo,
    showPagination: showCommissionPaging,
  } = useListPagination(commissionRows, 10, [commissionRows, queryParams]);

  const {
    pagedItems: pagedPayouts,
    currentPage: payoutPage,
    totalPages: payoutPages,
    setPage: setPayoutPage,
    pageNumbers: payoutPageNumbers,
    rangeFrom: payoutFrom,
    rangeTo: payoutTo,
    showPagination: showPayoutPaging,
  } = useListPagination(payoutRows, 10, [payoutRows, queryParams]);

  const clearFilters = () => {
    setDraftHotel('all');
    setDraftTuNgayText('');
    setDraftDenNgayText('');
    setHotelFilter('all');
    setTuNgay('');
    setDenNgay('');
  };

  const applyFilters = () => {
    const parsedTu = parseDisplayDate(draftTuNgayText);
    const parsedDen = parseDisplayDate(draftDenNgayText);
    if (parsedTu === null) {
      setDraftTuNgayText(toDisplayDate(tuNgay));
      return;
    }
    if (parsedDen === null) {
      setDraftDenNgayText(toDisplayDate(denNgay));
      return;
    }
    let nextTu = parsedTu;
    let nextDen = parsedDen;
    if (nextTu && nextDen && nextTu > nextDen) {
      nextDen = nextTu;
    }
    setDraftTuNgayText(nextTu ? toDisplayDate(nextTu) : '');
    setDraftDenNgayText(nextDen ? toDisplayDate(nextDen) : '');
    setHotelFilter(draftHotel);
    setTuNgay(nextTu || '');
    setDenNgay(nextDen || '');
  };

  const openPayoutDetail = (row) => {
    navigate(`/partner/finance/payouts/${encodeURIComponent(row.ma_dot)}`);
  };

  return (
    <div className="mgmt-page mgmt-list-page partner-finance-page">
      <ManagementHeader
        title="Quản lý tài chính"
        subtitle="Theo dõi doanh thu, hoa hồng và khoản thanh toán từ hệ thống."
      />

      {error && <div className="mgmt-toast error">{error}</div>}

      <div className="partner-finance-summary-panel">
        <div className="admin-finance-metrics admin-finance-metrics--5 partner-finance-metrics">
          <StatCard
            title="Tổng doanh thu"
            value={cards.tong_doanh_thu}
            subtitle="Đơn hoàn thành hợp lệ"
            tone="neutral"
          />
          <StatCard
            title="Hoa hồng hệ thống"
            value={cards.hoa_hong}
            subtitle="Tiền hệ thống giữ lại"
            tone="info"
          />
          <StatCard
            title="Đối tác thực nhận"
            value={cards.tien_doi_tac_nhan}
            subtitle="Sau khi trừ hoa hồng"
            tone="success"
          />
          <StatCard
            title="Chờ thanh toán"
            value={cards.cho_thanh_toan}
            subtitle="Đã đối soát chưa nhận"
            tone="warning"
          />
          <StatCard
            title="Đã nhận"
            value={cards.da_thanh_toan}
            subtitle="Các đợt đã thanh toán"
            tone="success"
          />
        </div>

        <div className="partner-finance-summary-toolbar">
          <div className="partner-finance-tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className={`partner-finance-tab${tab === item.id ? ' is-active' : ''}`}
                aria-selected={tab === item.id}
                onClick={() => handleTabChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="content-card finance-filter-card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
              Khách sạn
            </label>
            <select
              className="mgmt-select-inline"
              style={{ width: '100%' }}
              value={draftHotel}
              onChange={(e) => setDraftHotel(e.target.value)}
              aria-label="Lọc theo khách sạn"
            >
              <option value="all">Tất cả khách sạn</option>
              {hotels.map((hotel) => (
                <option key={hotel.ma_khach_san} value={String(hotel.ma_khach_san)}>
                  {hotel.ten}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
              Từ ngày
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="mgmt-select-inline partner-finance-date-input"
              style={{ width: '100%' }}
              value={draftTuNgayText}
              placeholder="dd/mm/yyyy"
              onChange={(e) => setDraftTuNgayText(e.target.value)}
              aria-label="Từ ngày"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#5a7a72', display: 'block', marginBottom: 4 }}>
              Đến ngày
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="mgmt-select-inline partner-finance-date-input"
              style={{ width: '100%' }}
              value={draftDenNgayText}
              placeholder="dd/mm/yyyy"
              onChange={(e) => setDraftDenNgayText(e.target.value)}
              aria-label="Đến ngày"
            />
          </div>
        </div>
        <FilterActions onApply={applyFilters} onClear={clearFilters} />
      </div>

      {loading ? (
        <div className="partner-finance-loading">Đang tải dữ liệu tài chính...</div>
      ) : (
        <>
          {tab === 'overview' && (
            <FinanceOverviewPanel
              charts={charts}
              recentPayments={recentPayments}
              onViewBooking={setDetailBookingId}
            />
          )}

          {tab === 'revenue' && (
            <div className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card">
              {revenueRows.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">Không có đơn doanh thu phù hợp bộ lọc</p>
                </div>
              ) : (
                <>
                  <div className="mgmt-table-scroll partner-finance-table-scroll">
                    <table className="data-table data-table-grid partner-finance-revenue-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách sạn</th>
                          <th>Loại phòng</th>
                          <th>Ngày nhận <br /> Trả phòng</th>
                          <th>Hoàn thành</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Thanh toán</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRevenue.map((row) => {
                          const st = PARTNER_TRANG_THAI[row.trang_thai] || { label: row.trang_thai, cls: '' };
                          const pay = getPaymentDisplay(row);
                          return (
                            <tr key={row.ma_dat_phong}>
                              <td className="mgmt-table-cell-code">
                                <span className="mgmt-cell-code" title={row.ma_don_hang}>
                                  {row.ma_don_hang}
                                </span>
                              </td>
                              <td>
                                <div className="partner-finance-cell-ellipsis" title={row.khach_san}>
                                  {row.khach_san}
                                </div>
                              </td>
                              <td>
                                <div className="partner-finance-cell-ellipsis" title={row.loai_phong}>
                                  {row.loai_phong}
                                </div>
                              </td>
                              <td>
                                <div className="partner-finance-date-range">
                                  <span>{formatDate(row.ngay_nhan_phong)}</span>
                                  <span>
                                    <span className="partner-finance-date-arrow"> </span>
                                    {formatDate(row.ngay_tra_phong)}
                                  </span>
                                </div>
                              </td>
                              <td className="partner-finance-cell-nowrap">
                                {formatDate(row.ngay_hoan_thanh)}
                              </td>
                              <td className="partner-finance-cell-money">
                                {formatCurrency(row.tong_tien)}
                              </td>
                              <td>
                                <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                              </td>
                              <td>
                                <span className={`mgmt-status-text ${pay.cls}`}>{pay.shortLabel}</span>
                              </td>
                              <ActionCell>
                                <ActionButton
                                  variant="view"
                                  iconOnly
                                  icon={Eye}
                                  title="Xem chi tiết"
                                  onClick={() => setDetailBookingId(row.ma_dat_phong)}
                                />
                              </ActionCell>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {showRevenuePaging && (
                    <ListPagination
                      total={revenueRows.length}
                      currentPage={revenuePage}
                      totalPages={revenuePages}
                      rangeFrom={revenueFrom}
                      rangeTo={revenueTo}
                      pageNumbers={revenuePageNumbers}
                      onPageChange={setRevenuePage}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'commission' && (
            <div className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card">
              {commissionRows.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">Không có đơn hoa hồng trong bộ lọc</p>
                </div>
              ) : (
                <>
                  <div className="mgmt-table-scroll partner-finance-table-scroll">
                    <table className="data-table data-table-grid partner-finance-commission-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách sạn</th>
                          <th>Tổng tiền</th>
                          <th>Tỷ lệ</th>
                          <th>Hoa hồng</th>
                          <th>ĐT nhận</th>
                          <th>Đối soát</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCommissions.map((row) => {
                          const st = COMMISSION_STATUS[row.trang_thai] || {
                            label: row.trang_thai,
                            cls: '',
                          };
                          return (
                            <tr key={row.ma_hoa_hong}>
                              <td className="mgmt-table-cell-code">
                                <span className="mgmt-cell-code" title={row.ma_don_hang}>{row.ma_don_hang}</span>
                              </td>
                              <td>
                                <div className="partner-finance-cell-ellipsis" title={row.khach_san}>
                                  {row.khach_san}
                                </div>
                              </td>
                              <td>{formatCurrency(row.tong_tien)}</td>
                              <td>{Number(row.ty_le_hoa_hong).toLocaleString('vi-VN')}%</td>
                              <td>{formatCurrency(row.tien_hoa_hong)}</td>
                              <td style={{ fontWeight: 600 }}>{formatCurrency(row.tien_doi_tac_nhan)}</td>
                              <td>
                                <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {showCommissionPaging && (
                    <ListPagination
                      total={commissionRows.length}
                      currentPage={commissionPage}
                      totalPages={commissionPages}
                      rangeFrom={commissionFrom}
                      rangeTo={commissionTo}
                      pageNumbers={commissionPageNumbers}
                      onPageChange={setCommissionPage}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'payout' && (
            <div className="mgmt-table-card mgmt-table-card--grid partner-finance-table-card">
              {payoutRows.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">Chưa có đợt thanh toán nào</p>
                </div>
              ) : (
                <>
                  <div className="mgmt-table-scroll partner-finance-table-scroll">
                    <table className="data-table data-table-grid partner-finance-payout-table">
                      <thead>
                        <tr>
                          <th>Đợt</th>
                          <th>Mã thanh toán</th>
                          <th>Số đơn</th>
                          <th>Tổng doanh thu</th>
                          <th>Tổng hoa hồng</th>
                          <th>Đối tác thực nhận</th>
                          <th>Trạng thái TT</th>
                          <th>Ngày thanh toán</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPayouts.map((row) => {
                          const st = PAYOUT_STATUS[row.trang_thai] || {
                            label: row.trang_thai,
                            cls: '',
                          };
                          return (
                            <tr key={row.ma_dot || row.ma_gd_doi_tac || row.ten_dot}>
                              <td style={{ fontWeight: 500 }}>{row.ten_dot || '—'}</td>
                              <td className="mgmt-table-cell-code">
                                <span className="mgmt-cell-code">
                                  {row.ma_gd_doi_tac || '—'}
                                </span>
                              </td>
                              <td>{row.so_don}</td>
                              <td>{formatCurrency(row.tong_doanh_thu)}</td>
                              <td>{formatCurrency(row.tong_hoa_hong)}</td>
                              <td style={{ fontWeight: 600 }}>
                                {formatCurrency(row.tien_doi_tac_nhan ?? row.so_tien_nhan)}
                              </td>
                              <td>
                                <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                              </td>
                              <td>{formatDate(row.ngay_thanh_toan)}</td>
                              <ActionCell>
                                <ActionButton
                                  variant="view"
                                  iconOnly
                                  icon={Eye}
                                  title="Xem chi tiết"
                                  onClick={() => openPayoutDetail(row)}
                                />
                              </ActionCell>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {showPayoutPaging && (
                    <ListPagination
                      total={payoutRows.length}
                      currentPage={payoutPage}
                      totalPages={payoutPages}
                      rangeFrom={payoutFrom}
                      rangeTo={payoutTo}
                      pageNumbers={payoutPageNumbers}
                      onPageChange={setPayoutPage}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <BookingDetailModal
        isOpen={Boolean(detailBookingId)}
        bookingId={detailBookingId}
        role="partner"
        onClose={() => setDetailBookingId(null)}
        onUpdated={loadData}
      />
    </div>
  );
};

export default FinancePage;
