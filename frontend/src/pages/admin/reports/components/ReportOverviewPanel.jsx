import { formatCurrency } from '../../../../utils/bookingDisplay';
import {
  ChartCard,
  ChartGrid,
  FinanceDualTrend,
  KpiCard,
  KpiGrid,
  Section,
  StatusDonut,
  TopHotelsBar,
  mapStatusLabels,
} from './ReportUI';

const ReportOverviewPanel = ({ data }) => {
  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const financeTrend = charts.dien_bien_tai_chinh
    || (charts.doanh_thu_theo_thoi_gian || []).map((r) => ({
      ...r,
      gmv: r.value,
      hoa_hong: 0,
    }));

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

      <Section title="Diễn biến tài chính & hoa hồng">
        <ChartGrid>
          <ChartCard title="Diễn biến Doanh thu GMV & Hoa hồng Sàn thu về" wide>
            <FinanceDualTrend data={financeTrend} />
          </ChartCard>
        </ChartGrid>
      </Section>

      <Section title="Hiệu suất khách sạn & trạng thái đơn">
        <ChartGrid>
          <ChartCard title="Top 5 khách sạn xuất sắc nhất">
            <TopHotelsBar data={charts.top_khach_san_doanh_thu || []} />
          </ChartCard>
          <ChartCard title="Phân bố trạng thái đơn đặt">
            <StatusDonut
              data={mapStatusLabels(
                charts.phan_bo_trang_thai_don_dat || charts.phan_bo_trang_thai_booking || [],
              )}
            />
          </ChartCard>
        </ChartGrid>
      </Section>
    </div>
  );
};

export default ReportOverviewPanel;
