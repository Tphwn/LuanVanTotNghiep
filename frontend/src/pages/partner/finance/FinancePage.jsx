import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import FinanceOverviewPanel from './FinanceOverviewPanel';
import PartnerCommissionDetailModal from './components/PartnerCommissionDetailModal';
import {
  TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../../utils/bookingDisplay';
import { getPresetRange } from '../../admin/reports/reportHelpers';
import DownSelect from '../../../components/common/management/DownSelect';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'revenue', label: 'Doanh thu' },
  { id: 'commission', label: 'Hoa hồng' },
  { id: 'payout', label: 'Thanh toán' },
];

const DEFAULT_PRESET = 'year';
const defaultRange = getPresetRange(DEFAULT_PRESET);

const COMMISSION_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'badge-warning' },
  da_thu: { label: 'Đã đối soát', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-info' },
};

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
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
  const [hotelFilter, setHotelFilter] = useState('all');
  const [tuNgay] = useState(defaultRange.tu_ngay);
  const [denNgay] = useState(defaultRange.den_ngay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailBookingId, setDetailBookingId] = useState(null);
  const [commissionDetailId, setCommissionDetailId] = useState(null);

  const [cards, setCards] = useState({
    tong_doanh_thu: 0,
    hoa_hong: 0,
    tien_doi_tac_nhan: 0,
    cho_thanh_toan: 0,
    da_thanh_toan: 0,
  });
  const [trendKy, setTrendKy] = useState('thang');
  const [charts, setCharts] = useState({
    revenue_trend: [],
    reconciliation_status: { tong_don: 0, items: [] },
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

  const overviewParams = useMemo(() => ({
    ...queryParams,
    ky: trendKy,
  }), [queryParams, trendKy]);

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
        const overviewRes = await api.get('/partner/finance/overview', { params: overviewParams });
        if (cancelled) return;
        const overviewData = overviewRes.data.data || {};
        setCards(overviewData.cards || {});
        setCharts(overviewData.charts || {
          revenue_trend: [],
          reconciliation_status: { tong_don: 0, items: [] },
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
  }, [overviewParams, queryParams, tab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const overviewRes = await api.get('/partner/finance/overview', { params: overviewParams });
      const overviewData = overviewRes.data.data || {};
      setCards(overviewData.cards || {});
      setCharts(overviewData.charts || {
        revenue_trend: [],
        reconciliation_status: { tong_don: 0, items: [] },
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
  }, [overviewParams, queryParams, tab]);
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
            subtitle="Giá trị phòng trước VAT"
            tone="neutral"
          />
          <StatCard
            title="Hoa hồng hệ thống"
            value={cards.hoa_hong}
            subtitle="Sàn cắt theo tỷ lệ"
            tone="info"
          />
          <StatCard
            title="Doanh thu thực nhận"
            value={cards.tien_doi_tac_nhan}
            subtitle="Sau hoa hồng + VAT"
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
      </div>

      <div className="partner-finance-toolbar">
        <div className="partner-finance-toolbar-hotel">
          <label htmlFor="partner-finance-hotel">Khách sạn</label>
          <DownSelect
            id="partner-finance-hotel"
            className="mgmt-select-inline"
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
          >
            <option value="all">Tất cả khách sạn</option>
            {hotels.map((hotel) => (
              <option key={hotel.ma_khach_san} value={String(hotel.ma_khach_san)}>
                {hotel.ten}
              </option>
            ))}
          </DownSelect>
        </div>

        <div className="partner-finance-tabs" role="tablist" aria-label="Mục tài chính">
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

      {loading ? (
        <div className="partner-finance-loading">Đang tải dữ liệu tài chính...</div>
      ) : (
        <>
          {tab === 'overview' && (
            <FinanceOverviewPanel
              charts={charts}
              recentPayments={recentPayments}
              onViewBooking={setDetailBookingId}
              trendKy={trendKy}
              onTrendKyChange={setTrendKy}
              hotelFilter={hotelFilter}
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
                          <th className="mgmt-col-hotel">Khách sạn</th>
                          <th>Nhận / Trả</th>
                          <th>Hoàn thành</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Thanh toán</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRevenue.map((row) => {
                          const st = TRANG_THAI[row.trang_thai] || { label: row.trang_thai, cls: 'badge-default' };
                          const pay = getPaymentDisplay(row);
                          return (
                            <tr key={row.ma_dat_phong}>
                              <td className="mgmt-table-cell-code">
                                <span className="mgmt-cell-code" title={row.ma_don_hang}>
                                  {row.ma_don_hang}
                                </span>
                              </td>
                              <td className="mgmt-col-hotel">
                                <div className="partner-finance-cell-text">{row.khach_san}</div>
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
                                <span className={`badge ${st.cls}`}>{st.label}</span>
                              </td>
                              <td>
                                <span className={`badge ${pay.badge || 'badge-default'}`}>{pay.shortLabel}</span>
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
                          <th className="mgmt-col-hotel">Khách sạn</th>
                          <th>Tổng doanh thu</th>
                          <th>Tỷ lệ</th>
                          <th>Hoa hồng sàn</th>
                          <th>Thực nhận</th>
                          <th>Đối soát</th>
                          <th>Thao tác</th>
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
                              <td className="mgmt-col-hotel">
                                <div className="partner-finance-cell-text">{row.khach_san}</div>
                              </td>
                              <td>{formatCurrency(row.tong_tien)}</td>
                              <td>{Number(row.ty_le_hoa_hong).toLocaleString('vi-VN')}%</td>
                              <td>{formatCurrency(row.tien_hoa_hong)}</td>
                              <td style={{ fontWeight: 600 }}>{formatCurrency(row.tien_doi_tac_nhan)}</td>
                              <td>
                                <span className={`badge ${st.cls}`}>{st.label}</span>
                              </td>
                              <ActionCell>
                                <ActionButton
                                  variant="view"
                                  iconOnly
                                  icon={Eye}
                                  title="Xem chi tiết hoa hồng"
                                  onClick={() => setCommissionDetailId(row.ma_hoa_hong)}
                                />
                              </ActionCell>
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
                          <th>Hoa hồng sàn</th>
                          <th>Thực nhận</th>
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
                              <td className="mgmt-col-name" style={{ fontWeight: 500 }}>{row.ten_dot || '—'}</td>
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
                                <span className={`badge ${st.cls}`}>{st.label}</span>
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

      <PartnerCommissionDetailModal
        commissionId={commissionDetailId}
        onClose={() => setCommissionDetailId(null)}
      />
    </div>
  );
};

export default FinancePage;
