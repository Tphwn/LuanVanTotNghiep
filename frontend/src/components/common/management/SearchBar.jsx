import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="mgmt-search-wrap">
    <Search size={18} className="mgmt-search-icon" />
    <input
      type="text"
      className="mgmt-search-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

export default SearchBar;
