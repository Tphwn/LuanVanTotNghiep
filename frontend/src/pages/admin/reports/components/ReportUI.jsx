import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../../utils/bookingDisplay';
import { BOOKING_STATUS_LABEL, CHART_COLORS, formatAxisMoney } from '../reportHelpers';

const STATUS_PIE_COLORS = {
  hoan_thanh: '#10B981',
  da_checkin: '#3B82F6',
  da_xac_nhan: '#64748b',
  cho_xac_nhan: '#94a3b8',
  da_huy: '#EF4444',
  bi_huy: '#EF4444',
  tu_choi: '#F97316',
  khac: '#94a3b8',
};

const truncateLabel = (text, max = 22) => {
  const s = String(text || '');
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
};

const HotelYTick = ({ x, y, payload }) => {
  const full = payload?.value || '';
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#64748b" fontSize={11}>
        {truncateLabel(full, 20)}
      </text>
    </g>
  );
};

const TopHotelTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  return (
    <div className="admin-reports-hotel-tooltip">
      <p className="admin-reports-hotel-tooltip-title">{row.ten || '—'}</p>
      <ul className="admin-reports-hotel-tooltip-list">
        <li>
          <span className="admin-reports-hotel-tooltip-dot" style={{ background: '#3C7363' }} />
          <span className="admin-reports-hotel-tooltip-label">Tổng doanh thu</span>
          <b>{formatCurrency(row.value)}</b>
        </li>
        <li>
          <span className="admin-reports-hotel-tooltip-dot" style={{ background: '#F59E0B' }} />
          <span className="admin-reports-hotel-tooltip-label">Hoa hồng mang lại</span>
          <b>{formatCurrency(row.hoa_hong)}</b>
        </li>
        <li>
          <span className="admin-reports-hotel-tooltip-dot" style={{ background: '#64748b' }} />
          <span className="admin-reports-hotel-tooltip-label">Tổng đơn thành công</span>
          <b>
            {row.so_don ?? 0}
            {' '}
            đơn
          </b>
        </li>
      </ul>
    </div>
  );
};

export const KpiGrid = ({ children, cols = 4 }) => (
  <div className={`admin-reports-kpi-grid admin-reports-kpi-grid--${cols}`}>
    {children}
  </div>
);

export const KpiCard = ({ title, value, tone }) => (
  <div className={`admin-reports-kpi${tone ? ` is-${tone}` : ''}`}>
    <span className="admin-reports-kpi-label">{title}</span>
    <strong className="admin-reports-kpi-value">{value}</strong>
  </div>
);

export const Section = ({ title, children }) => (
  <section className="admin-reports-section">
    {title ? <h3 className="admin-reports-section-heading">{title}</h3> : null}
    {children}
  </section>
);

export const ChartGrid = ({ children }) => (
  <div className="admin-reports-chart-grid">{children}</div>
);

export const ChartCard = ({ title, children, wide }) => (
  <article className={`admin-reports-chart-card${wide ? ' is-wide' : ''}`}>
    <h4 className="admin-reports-chart-title">{title}</h4>
    <div className="admin-reports-chart-body">{children}</div>
  </article>
);

export const EmptyChart = ({ text = 'Chưa có dữ liệu trong khoảng thời gian này' }) => (
  <div className="admin-reports-chart-empty">{text}</div>
);

export const RankList = ({ title, rows = [], formatValue = (v) => v }) => (
  <article className="admin-reports-rank">
    <h4 className="admin-reports-rank-heading">{title}</h4>
    {!rows.length ? (
      <p className="admin-reports-rank-empty">Chưa có dữ liệu</p>
    ) : (
      <ol className="admin-reports-rank-list">
        {rows.map((row, idx) => (
          <li key={`${row.ten || row.name || row.label}-${idx}`}>
            <span className="admin-reports-rank-index">{idx + 1}</span>
            <span className="admin-reports-rank-name" title={row.ten || row.name || row.label}>
              {row.ten || row.name || row.label || '—'}
            </span>
            <span className="admin-reports-rank-value">{formatValue(row.value)}</span>
          </li>
        ))}
      </ol>
    )}
  </article>
);

export const RankGrid = ({ children }) => (
  <div className="admin-reports-rank-grid">{children}</div>
);

export const mapStatusLabels = (rows = []) =>
  rows.map((r) => ({
    ...r,
    key: r.name,
    name: BOOKING_STATUS_LABEL[r.name] || r.name,
  }));

export const RevenueLine = ({ data, name = 'Doanh thu' }) => {
  if (!data?.some((r) => Number(r.value) > 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={formatAxisMoney}
          tick={{ fontSize: 11, fill: '#64748b' }}
          width={44}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v) => [formatCurrency(v), name]} />
        <Line type="monotone" dataKey="value" stroke="#3C7363" strokeWidth={2.4} dot={{ r: 3, fill: '#3C7363' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const CountLine = ({ data, name = 'Số lượng', color = '#3C7363' }) => {
  if (!data?.some((r) => Number(r.value) > 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={32} axisLine={false} tickLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.4} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/** Area doanh thu + Line số đơn (dual axis) — dùng Dashboard tổng quan */
export const RevenueBookingTrend = ({ revenueData, bookingData }) => {
  const rev = revenueData || [];
  const book = bookingData || [];
  const bookByKey = Object.fromEntries(book.map((r) => [r.key || r.label, r]));
  const rows = rev.map((r) => {
    const b = bookByKey[r.key || r.label] || {};
    return {
      key: r.key,
      label: r.label,
      doanh_thu: Number(r.value) || 0,
      so_don: Number(b.value ?? b.count) || 0,
    };
  });
  const hasData = rows.some((r) => r.doanh_thu > 0 || r.so_don > 0);
  if (!hasData) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dashRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3C7363" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3C7363" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="money"
          tickFormatter={formatAxisMoney}
          tick={{ fontSize: 11, fill: '#64748b' }}
          width={48}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Tiền (đ)',
            angle: -90,
            position: 'insideLeft',
            offset: 4,
            style: { fontSize: 11, fill: '#5a7a72' },
          }}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
          width={36}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Số đơn',
            angle: 90,
            position: 'insideRight',
            offset: 4,
            style: { fontSize: 11, fill: '#5a7a72' },
          }}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'Số đơn đặt') return [value, name];
            return [formatCurrency(value), name];
          }}
          labelFormatter={(label) => `Thời gian: ${label}`}
        />
        <Legend />
        <Area
          yAxisId="money"
          type="monotone"
          dataKey="doanh_thu"
          name="Doanh thu"
          stroke="#3C7363"
          strokeWidth={2}
          fill="url(#dashRevenueFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="so_don"
          name="Số đơn đặt"
          stroke="#F59E0B"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

/** Area GMV + Line hoa hồng (trục tiền chung) */
export const FinanceDualTrend = ({ data }) => {
  const rows = data || [];
  const hasData = rows.some((r) => Number(r.gmv) > 0 || Number(r.hoa_hong) > 0 || Number(r.value) > 0);
  if (!hasData) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={rows} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gmvAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3C7363" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3C7363" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={formatAxisMoney}
          tick={{ fontSize: 11, fill: '#64748b' }}
          width={48}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Tiền (đ)',
            angle: -90,
            position: 'insideLeft',
            offset: 4,
            style: { fontSize: 11, fill: '#5a7a72' },
          }}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrency(value), name]}
          labelFormatter={(label) => `Thời gian: ${label}`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="gmv"
          name="Tổng doanh thu"
          stroke="#3C7363"
          strokeWidth={2}
          fill="url(#gmvAreaFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="hoa_hong"
          name="Hoa hồng sàn thu về"
          stroke="#F59E0B"
          strokeWidth={2.8}
          dot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

/** Top KS — bar ngang + tooltip GMV / HH / số đơn */
export const TopHotelsBar = ({ data }) => {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatAxisMoney}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="ten"
          width={128}
          tick={<HotelYTick />}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <Tooltip content={<TopHotelTooltip />} cursor={{ fill: 'rgba(60,115,99,0.06)' }} />
        <Bar dataKey="value" name="GMV" fill="#3C7363" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Donut trạng thái — màu semantic + tổng ở giữa */
export const StatusDonut = ({ data }) => {
  const rows = (data || []).filter((r) => Number(r.value) > 0);
  if (!rows.length) return <EmptyChart />;
  const total = rows.reduce((s, r) => s + (Number(r.value) || 0), 0);

  return (
    <div className="admin-reports-donut-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {rows.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_PIE_COLORS[entry.key || entry.name] || STATUS_PIE_COLORS.khac}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0;
              return [`${value} đơn (${pct}%)`, name];
            }}
          />
          <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="admin-reports-donut-center">
        <strong>{total}</strong>
        <span>Đơn đặt</span>
      </div>
    </div>
  );
};

export const MoneyBar = ({ data, nameKey = 'ten', color = '#3C7363', horizontal }) => {
  if (!data?.length) return <EmptyChart />;
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" horizontal={false} />
          <XAxis type="number" tickFormatter={formatAxisMoney} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey={nameKey} width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={48} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatAxisMoney} width={44} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => formatCurrency(v)} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ScoreBar = ({ data, nameKey = 'ten' }) => {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0ed" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={48} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 5]} width={28} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="value" name="Điểm TB" fill="#b45309" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SimplePie = ({ data, money }) => {
  if (!data?.some((r) => Number(r.value) > 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="46%"
          innerRadius={48}
          outerRadius={78}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => (money ? formatCurrency(v) : v)} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};
