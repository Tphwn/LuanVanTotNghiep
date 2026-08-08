// switch để bật tắt các trang admin, partner, user
const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  compact = false,
  hideLabel = false,
  labelOn = 'Đang hoạt động',
  labelOff = 'Tạm ngừng',
}) => (
  <button
    type="button"
    className={`mgmt-toggle${checked ? ' on' : ' off'}${disabled ? ' disabled' : ''}${compact ? ' mgmt-toggle-compact' : ''}`}
    onClick={disabled ? undefined : onChange}
    disabled={disabled}
    aria-pressed={checked}
    aria-label={checked ? labelOn : labelOff}
  >
    <span className="mgmt-toggle-track">
      <span className="mgmt-toggle-thumb" />
    </span>
    {!hideLabel && (
      <span className="mgmt-toggle-label">{checked ? labelOn : labelOff}</span>
    )}
  </button>
);

export default ToggleSwitch;
