import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CalendarCheck,
  CalendarMinus,
  ClipboardList,
  MessageSquareWarning,
} from 'lucide-react';
import ManagementHeader from '../../components/common/management/ManagementHeader';
import MetricCard from '../../components/common/management/MetricCard';
import api from '../../services/api';
import { formatCurrency } from '../../utils/bookingDisplay';
import ROUTES from '../../constants/routes';

const KPI_COLOR = '#3C7363';

const TASK_GROUPS = [
  {
    id: 'van_hanh',
    title: 'Vận hành Lễ tân',
    tone: 'ops',
    icon: BellRing,
    items: [
      {
        key: 'don_sap_check_in',
        label: 'Đơn sắp Check-in',
        hint: 'Hôm nay & ngày mai',
        path: ROUTES.PARTNER.BOOKINGS,
        icon: CalendarCheck,
      },
      {
        key: 'don_sap_check_out',
        label: 'Đơn sắp Check-out',
        hint: 'Trả phòng hôm nay',
        path: ROUTES.PARTNER.BOOKINGS,
        icon: CalendarMinus,
      },
      {
        key: 'booking_cho_xac_nhan',
        label: 'Booking mới chờ xác nhận',
        hint: 'Cần xác nhận sớm',
        path: ROUTES.PARTNER.BOOKINGS,
        icon: ClipboardList,
      },
    ],
  },
  {
    id: 'cham_soc',
    title: 'Chăm sóc Khách hàng',
    tone: 'care',
    icon: MessageSquareWarning,
    items: [
      {
        key: 'danh_gia_chua_phan_hoi',
        label: 'Đánh giá chưa phản hồi',
        hint: 'Khách đang chờ trả lời',
        path: ROUTES.PARTNER.REVIEWS,
        icon: MessageSquareWarning,
      },
    ],
  },
];

const PartnerDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/partner/dashboard');
        if (mounted) setData(res.data?.data || null);
      } catch (err) {
        if (mounted) {
          setData(null);
          setError(err.response?.data?.message || 'Không tải được tổng quan');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = data?.kpis || {};
  const tasks = data?.viec_can_xu_ly || {};

  const kpiCards = [
    { label: 'Tổng khách sạn', value: kpis.tong_khach_san ?? 0 },
    { label: 'Phòng trống hôm nay', value: kpis.phong_trong_hom_nay ?? 0 },
    { label: 'Đặt phòng mới', value: kpis.dat_phong_moi ?? 0 },
    { label: 'Doanh thu tháng', value: formatCurrency(kpis.doanh_thu_thang) },
    { label: 'Điểm đánh giá', value: `${kpis.diem_danh_gia_tb ?? 0}/5` },
    { label: 'Chờ thanh toán', value: formatCurrency(kpis.cho_thanh_toan) },
  ];

  const pendingTotal = TASK_GROUPS.reduce((sum, group) => {
    const groupData = tasks[group.id] || {};
    return sum + group.items.reduce((s, item) => s + (Number(groupData[item.key]) || 0), 0);
  }, 0);

  return (
    <div className="mgmt-page partner-dashboard-page">
      <ManagementHeader
        title="Tổng quan"
        subtitle="Theo dõi phòng trống, đơn mới và việc cần xử lý hôm nay"
      />

      {loading ? (
        <div className="partner-dashboard-loading">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="partner-dashboard-error">{error}</div>
      ) : (
        <>
          <div className="mgmt-metric-grid mgmt-metric-grid--3 partner-dashboard-kpi-grid">
            {kpiCards.map((s) => (
              <MetricCard key={s.label} label={s.label} value={s.value} color={KPI_COLOR} />
            ))}
          </div>

          <section className="partner-dashboard-tasks">
            <header className="partner-dashboard-tasks-header">
              <div>
                <h3>Việc cần xử lý</h3>
                <p>Nhóm theo luồng vận hành và chăm sóc khách</p>
              </div>
              <span className={`badge ${pendingTotal > 0 ? 'badge-warning' : 'badge-success'}`}>
                {pendingTotal} việc
              </span>
            </header>

            <div className="partner-dashboard-task-groups">
              {TASK_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                const groupData = tasks[group.id] || {};
                return (
                  <article
                    key={group.id}
                    className={`partner-dashboard-task-group partner-dashboard-task-group--${group.tone}`}
                  >
                    <header className="partner-dashboard-task-group-header">
                      <span className="partner-dashboard-task-group-icon" aria-hidden="true">
                        <GroupIcon size={18} />
                      </span>
                      <h4>{group.title}</h4>
                    </header>
                    <div className="partner-dashboard-task-list">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const count = Number(groupData[item.key]) || 0;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`partner-dashboard-task-card${count > 0 ? ' has-items' : ''}`}
                            onClick={() => navigate(item.path)}
                          >
                            <span className="partner-dashboard-task-item-icon" aria-hidden="true">
                              <ItemIcon size={16} />
                            </span>
                            <span className="partner-dashboard-task-main">
                              <span className="partner-dashboard-task-label">{item.label}</span>
                              <span className="partner-dashboard-task-hint">{item.hint}</span>
                            </span>
                            <strong className="partner-dashboard-task-count">{count}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PartnerDashboardPage;
