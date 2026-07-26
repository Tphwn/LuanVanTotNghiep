import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import ReportDateFilter from './components/ReportDateFilter';
import ReportOverviewPanel from './components/ReportOverviewPanel';
import ReportFinancePanel from './components/ReportFinancePanel';
import ReportBusinessPanel from './components/ReportBusinessPanel';
import ReportSystemPanel from './components/ReportSystemPanel';
import { useReportDateFilter, getPresetRange } from './reportHelpers';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'business', label: 'Kinh doanh' },
  { id: 'system', label: 'Hệ thống' },
];

const ENDPOINT_BY_TAB = {
  overview: '/admin/analytics/overview',
  finance: '/admin/analytics/finance',
  business: '/admin/analytics/business',
  system: '/admin/analytics/system',
};

const SELF_CONTAINED_TABS = new Set(['finance', 'business', 'system']);

/** Mapping bộ lọc thời gian → cách chia trục X biểu đồ */
const PRESET_TO_NHOM = {
  today: 'ngay',   // Hôm nay → theo giờ/ngày trong ngày
  week: 'ngay',    // Tuần này → từng ngày trong tuần
  month: 'ngay',   // Tháng này → từng ngày trong tháng
  year: 'thang',   // Năm nay → từng tháng trong năm
  custom: 'thang', // Tùy chọn → theo tháng trong khoảng chọn
};

const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';

  const dateFilter = useReportDateFilter('month');
  const [appliedQuery, setAppliedQuery] = useState(dateFilter.query);
  const [appliedPreset, setAppliedPreset] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const loadData = useCallback(async (activeTab, query) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(ENDPOINT_BY_TAB[activeTab], { params: query });
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Không tải được dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SELF_CONTAINED_TABS.has(tab)) return;
    const query =
      tab === 'overview'
        ? { ...appliedQuery, nhom: PRESET_TO_NHOM[appliedPreset] || 'thang' }
        : appliedQuery;
    loadData(tab, query);
  }, [tab, appliedQuery, appliedPreset, loadData]);

  useEffect(() => {
    if (dateFilter.preset !== 'custom') return;
    setAppliedQuery({ ...dateFilter.query });
    setAppliedPreset('custom');
  }, [dateFilter.preset, dateFilter.query]);

  const activeTabLabel = TABS.find((t) => t.id === tab)?.label || 'Tổng quan';
  const showGlobalDateFilter = !SELF_CONTAINED_TABS.has(tab);

  return (
    <div className="admin-reports-page">
      <header className="admin-reports-header">
        <div className="admin-reports-header-main">
          <h1 className="admin-reports-title">Quản lý báo cáo</h1>
          <p className="admin-reports-subtitle">
            Theo dõi hiệu suất hệ thống theo từng nhóm chỉ số
          </p>
        </div>
      </header>

      <div className="admin-reports-toolbar">
        <nav className="admin-reports-tabs" aria-label="Nhóm báo cáo">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-reports-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {showGlobalDateFilter ? (
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
        ) : null}
      </div>

      <div className="admin-reports-content">
        {showGlobalDateFilter ? (
          <div className="admin-reports-content-label">{activeTabLabel}</div>
        ) : null}

        {tab === 'finance' ? (
          <ReportFinancePanel />
        ) : tab === 'business' ? (
          <ReportBusinessPanel />
        ) : tab === 'system' ? (
          <ReportSystemPanel />
        ) : loading ? (
          <div className="admin-reports-loading">Đang tải báo cáo...</div>
        ) : error ? (
          <div className="admin-reports-error">{error}</div>
        ) : (
          <>
            {tab === 'overview' && (
              <ReportOverviewPanel data={data} preset={appliedPreset} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
