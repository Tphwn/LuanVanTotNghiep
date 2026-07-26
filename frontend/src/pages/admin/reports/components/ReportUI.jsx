import {
  ResponsiveContainer,
  LineChart,
  Line,
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
