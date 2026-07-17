
const FilterActions = ({
  onApply,
  onClear,
  applyLabel = 'Lọc',
  clearLabel = 'Xóa lọc',
  applyClassName = 'btn btn-primary btn-sm',
  clearClassName = 'btn btn-ghost btn-sm',
}) => (
  <div className="mgmt-filter-actions">
    <button type="button" className={applyClassName} onClick={onApply}>
      {applyLabel}
    </button>
    <button type="button" className={clearClassName} onClick={onClear}>
      {clearLabel}
    </button>
  </div>
);

export default FilterActions;
