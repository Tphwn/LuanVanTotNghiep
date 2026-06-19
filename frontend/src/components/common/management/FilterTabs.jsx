const FilterTabs = ({ tabs, active, onChange }) => (
  <div className="mgmt-filter-tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`mgmt-filter-tab${active === tab.id ? ' active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
        {tab.count != null && <span className="mgmt-filter-count">{tab.count}</span>}
      </button>
    ))}
  </div>
);

export default FilterTabs;
