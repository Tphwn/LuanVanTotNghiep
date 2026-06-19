const SummaryStats = ({ items }) => (
  <div className="mgmt-stats-grid">
    {items.map((item) => (
      <div key={item.label} className="mgmt-stat-card">
        <div className="mgmt-stat-label">{item.label}</div>
        <div className="mgmt-stat-value" style={{ color: item.color || '#1a2e28' }}>
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

export default SummaryStats;
