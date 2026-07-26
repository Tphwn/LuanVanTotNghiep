import { REPORT_DATE_PRESETS } from '../reportHelpers';

const ReportDateFilter = ({
  preset,
  tuNgay,
  denNgay,
  onPresetChange,
  onFromChange,
  onToChange,
}) => (
  <div className="admin-reports-toolbar-filter">
    <div className="admin-reports-presets" role="group" aria-label="Khoảng thời gian">
      {REPORT_DATE_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`admin-reports-preset${preset === p.value ? ' is-active' : ''}`}
          onClick={() => onPresetChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
    {preset === 'custom' ? (
      <div className="admin-reports-custom-range">
        <input
          type="date"
          value={tuNgay}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label="Từ ngày"
        />
        <span className="admin-reports-range-sep">→</span>
        <input
          type="date"
          value={denNgay}
          onChange={(e) => onToChange(e.target.value)}
          aria-label="Đến ngày"
        />
      </div>
    ) : null}
  </div>
);

export default ReportDateFilter;
