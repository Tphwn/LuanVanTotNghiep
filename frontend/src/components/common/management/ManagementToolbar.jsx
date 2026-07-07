import SearchBar from './SearchBar';
import FilterTabs from './FilterTabs';

const ManagementToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => (
  <div className="mgmt-toolbar-block">
    {tabs ? (
      <FilterTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
    ) : null}
    <div className="mgmt-toolbar-row">
      <SearchBar
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
      {children}
    </div>
  </div>
);

export default ManagementToolbar;
