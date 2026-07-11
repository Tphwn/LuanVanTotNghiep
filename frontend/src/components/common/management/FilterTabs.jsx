const FilterTabs = ({ tabs, active, onChange }) => (
  <div className="mgmt-stats-grid mgmt-stats-grid--filter">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`mgmt-stat-card mgmt-stat-card--filter${tab.tone ? ` mgmt-stat-card--tone-${tab.tone}` : ''}${active === tab.id ? ' is-active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        <div className="mgmt-stat-label">{tab.label}</div>
        <div className="mgmt-stat-value">{tab.count ?? '—'}</div>
      </button>
    ))}
  </div>
);

export default FilterTabs;
