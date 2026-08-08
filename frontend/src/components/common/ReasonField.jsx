
const ReasonField = ({
  id,
  label = 'Lý do',
  required = false,
  value,
  onChange,
  error,
  hint,
  placeholder = '',
  rows = 4,
  disabled = false,
}) => (
  <div className="reason-field">
    <label className="reason-field-label" htmlFor={id}>
      {label}
      {required && <span className="reason-field-required"> *</span>}
    </label>
    <textarea
      id={id}
      className={`reason-field-textarea${error ? ' is-error' : ''}`}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
    {error && <p className="reason-field-error">{error}</p>}
    {!error && hint && <p className="reason-field-hint">{hint}</p>}
  </div>
);

export default ReasonField;
