const SummaryStats = ({ items }) => (
  <div className="mgmt-stats-grid">
    {items.map((item) => (
      <div
        key={item.label}
        className={`mgmt-stat-card${item.tone ? ` mgmt-stat-card--tone-${item.tone}` : ''}`}
      >
        <div className="mgmt-stat-label">{item.label}</div>
        <div
          className="mgmt-stat-value"
          style={item.tone ? undefined : { color: item.color || '#1a2e28' }}
        >
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

export default SummaryStats;
