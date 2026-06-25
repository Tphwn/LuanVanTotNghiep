const MetricCard = ({ label, value, color = '#3C7363' }) => (
  <div
    className="mgmt-metric-card"
    style={{ '--metric-color': color }}
  >
    <div className="mgmt-metric-card__value">{value}</div>
    <div className="mgmt-metric-card__label">{label}</div>
  </div>
);

export default MetricCard;
