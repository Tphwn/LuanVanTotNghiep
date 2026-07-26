import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagementHeader from '../../components/common/management/ManagementHeader';
import MetricCard from '../../components/common/management/MetricCard';
import api from '../../services/api';
import { formatCurrency } from '../../utils/bookingDisplay';
import ROUTES from '../../constants/routes';
import ReportDateFilter from './reports/components/ReportDateFilter';
import { ChartCard, CountLine, RevenueLine } from './reports/components/ReportUI';
import {
  getPresetRange,
  PRESET_PERIOD_LABEL,
  useReportDateFilter,
} from './reports/reportHelpers';

const PRESET_TO_NHOM = {
  today: 'ngay',
  week: 'ngay',
  month: 'ngay',
  year: 'thang',
  custom: 'thang',
};

const KPI_COLOR = '#3C7363';

const TASK_ITEMS = [
  {
    key: 'yeu_cau_hop_tac',
    label: 'Yêu cầu hợp tác',
    hint: 'Chờ liên hệ / xử lý',
    tone: 'warning',
    path: ROUTES.ADMIN.PARTNER_REQUESTS,
  },
  {
    key: 'cho_duyet',
    label: 'Chờ duyệt',
    hint: 'Khách sạn chờ duyệt',
    tone: 'info',
    path: ROUTES.ADMIN.HOTELS,
  },
  {
    key: 'thanh_toan',
    label: 'Thanh toán',
    hint: 'Đối tác chờ thanh toán',
    tone: 'warning',
    path: ROUTES.ADMIN.FINANCE,
  },
  {
    key: 'hoan_tien',
    label: 'Hoàn tiền',
    hint: 'Đơn cần hoàn / đang xử lý',
    tone: 'danger',
    path: ROUTES.ADMIN.FINANCE,
  },
  {
    key: 'danh_gia_vi_pham',
    label: 'Đánh giá vi phạm',
    hint: 'Khiếu nại chờ xử lý',
    tone: 'danger',
    path: ROUTES.ADMIN.REPORTS_COMPLAINTS,
  },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const dateFilter = useReportDateFilter('month');
  const [appliedQuery, setAppliedQuery] = useState(dateFilter.query);
  const [appliedPreset, setAppliedPreset] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (query, preset) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/analytics/dashboard', {
        params: {
          ...query,
          nhom: PRESET_TO_NHOM[preset] || 'ngay',
        },
      });
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Không tải được dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(appliedQuery, appliedPreset);
  }, [appliedQuery, appliedPreset, loadData]);

  useEffect(() => {
    if (dateFilter.preset !== 'custom') return;
    setAppliedQuery({ ...dateFilter.query });
    setAppliedPreset('custom');
  }, [dateFilter.preset, dateFilter.query]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const tasks = data?.viec_can_xu_ly || {};
  const periodLabel = PRESET_PERIOD_LABEL[appliedPreset] || 'tháng';
  const pendingTotal = TASK_ITEMS.reduce(
    (sum, item) => sum + (Number(tasks[item.key]) || 0),
    0
  );

  const scaleStats = [
    { label: 'Tổng Người dùng', value: kpis.tong_nguoi_dung ?? 0 },
    { label: 'Tổng Khách sạn', value: kpis.tong_khach_san ?? 0 },
    { label: 'Tổng Đối tác', value: kpis.tong_doi_tac ?? 0 },
  ];

  const perfStats = [
    { label: 'Tổng Booking', value: kpis.tong_booking ?? 0 },
    { label: 'Tổng Doanh thu', value: formatCurrency(kpis.tong_doanh_thu) },
    { label: 'Điểm đánh giá TB', value: `${kpis.diem_danh_gia_tb ?? 0}/5` },
  ];

  return (
    <div className="mgmt-page admin-dashboard-page">
      <div className="admin-dashboard-header-row">
        <ManagementHeader
          title="Tổng quan"
          subtitle="Theo dõi toàn bộ hoạt động hệ thống"
        />
        <ReportDateFilter
          preset={dateFilter.preset}
          tuNgay={dateFilter.tuNgay}
          denNgay={dateFilter.denNgay}
          onPresetChange={(value) => {
            dateFilter.applyPreset(value);
            if (value !== 'custom') {
              setAppliedQuery(getPresetRange(value));
              setAppliedPreset(value);
            }
          }}
          onFromChange={dateFilter.setTuNgay}
          onToChange={dateFilter.setDenNgay}
        />
      </div>

      {loading ? (
        <div className="admin-dashboard-loading">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="admin-dashboard-error">{error}</div>
      ) : (
        <>
          <div className="admin-dashboard-kpi-block">
            <p className="admin-dashboard-kpi-group-label">Quy mô</p>
            <div className="mgmt-metric-grid mgmt-metric-grid--3">
              {scaleStats.map((s) => (
                <MetricCard key={s.label} label={s.label} value={s.value} color={KPI_COLOR} />
              ))}
            </div>
            <p className="admin-dashboard-kpi-group-label">Hiệu suất</p>
            <div className="mgmt-metric-grid mgmt-metric-grid--3">
              {perfStats.map((s) => (
                <MetricCard key={s.label} label={s.label} value={s.value} color={KPI_COLOR} />
              ))}
            </div>
          </div>

          <div className="admin-dashboard-body">
            <section className="admin-dashboard-charts">
              <ChartCard title={`Doanh thu theo: ${periodLabel}`}>
                <RevenueLine data={charts.doanh_thu_theo_thoi_gian} />
              </ChartCard>
              <ChartCard title={`Đơn đặt theo: ${periodLabel}`}>
                <CountLine
                  data={charts.don_dat_theo_thoi_gian}
                  name="Đơn đặt"
                  color="#3C7363"
                />
              </ChartCard>
            </section>

            <aside className="admin-dashboard-tasks">
              <header className="admin-dashboard-tasks-header">
                <h3>Việc cần xử lý</h3>
                <span className={`badge ${pendingTotal > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {pendingTotal} việc
                </span>
              </header>
              <div className="admin-dashboard-tasks-list">
                {TASK_ITEMS.map((item) => {
                  const count = Number(tasks[item.key]) || 0;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`admin-dashboard-task-card admin-dashboard-task-card--${item.tone}${count > 0 ? ' has-items' : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <div className="admin-dashboard-task-main">
                        <span className="admin-dashboard-task-label">{item.label}</span>
                        <span className="admin-dashboard-task-hint">{item.hint}</span>
                      </div>
                      <strong className="admin-dashboard-task-count">{count}</strong>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
