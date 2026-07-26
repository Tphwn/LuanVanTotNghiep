import { formatCurrency } from '../../../../utils/bookingDisplay';
import {
  ChartCard,
  ChartGrid,
  CountLine,
  KpiCard,
  KpiGrid,
  MoneyBar,
  RevenueLine,
  Section,
  SimplePie,
  mapStatusLabels,
} from './ReportUI';

const PRESET_PERIOD_LABEL = {
  today: 'ngày',
  week: 'tuần',
  month: 'tháng',
  year: 'năm',
  custom: 'tùy chọn',
};

const ReportOverviewPanel = ({ data, preset = 'month' }) => {
  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const periodLabel = PRESET_PERIOD_LABEL[preset] || PRESET_PERIOD_LABEL[data?.preset] || 'tháng';

  return (
    <div className="admin-reports-panel">
      <Section>
        <KpiGrid cols={6}>
          <KpiCard title="Tổng doanh thu" value={formatCurrency(kpis.tong_doanh_thu)} tone="success" />
          <KpiCard title="Tổng đơn đặt" value={kpis.tong_dat_phong ?? 0} tone="info" />
          <KpiCard title="Khách sạn" value={kpis.tong_khach_san ?? 0} />
          <KpiCard title="Khách hàng" value={kpis.tong_khach_hang ?? 0} />
          <KpiCard title="Đối tác" value={kpis.tong_doi_tac ?? 0} />
          <KpiCard title="Tỷ lệ hủy" value={`${kpis.ty_le_huy ?? 0}%`} tone="danger" />
        </KpiGrid>
      </Section>

      <Section title="Biểu đồ tổng quan">
        <ChartGrid>
          <ChartCard title={`Doanh thu theo: ${periodLabel}`}>
            <RevenueLine data={charts.doanh_thu_theo_thoi_gian || charts.doanh_thu_theo_thang} />
          </ChartCard>
          <ChartCard title={`Đơn đặt theo: ${periodLabel}`}>
            <CountLine
              data={charts.don_dat_theo_thoi_gian || charts.booking_theo_thang}
              name="Đơn đặt"
            />
          </ChartCard>
          <ChartCard title="Top 5 khách sạn theo doanh thu">
            <MoneyBar data={charts.top_khach_san_doanh_thu} horizontal />
          </ChartCard>
          <ChartCard title="Phân bố trạng thái đơn đặt">
            <SimplePie
              data={mapStatusLabels(
                charts.phan_bo_trang_thai_don_dat || charts.phan_bo_trang_thai_booking
              )}
            />
          </ChartCard>
        </ChartGrid>
      </Section>
    </div>
  );
};

export default ReportOverviewPanel;
