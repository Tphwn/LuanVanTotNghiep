import EditField from '../../users/components/EditField';

const NOTIFY_OPTIONS = [
  { key: 'none', label: 'Không gửi', desc: 'Không gửi thông báo' },
  { key: 'all', label: 'Tất cả đối tác', desc: 'Thông báo toàn bộ đối tác đang hoạt động' },
  { key: 'one', label: 'Một đối tác', desc: 'Chọn đối tác cụ thể' },
];

/**
 * Form chọn phạm vi thông báo đối tác (thêm / khóa / mở tiện nghi).
 */
const AmenityPartnerNotifyFields = ({
  label = 'Gửi thông báo cho đối tác',
  notifyScope,
  onNotifyScopeChange,
  partnerId,
  onPartnerIdChange,
  partners = [],
  compact = false,
}) => (
  <div className={compact ? 'amenity-notify-fields amenity-notify-fields--compact' : 'amenity-notify-fields'}>
    <EditField label={label}>
      <div className="amenity-form-scope-row" style={{ marginTop: 4 }}>
        {NOTIFY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`amenity-scope-btn${notifyScope === opt.key ? ' active' : ''}`}
            onClick={() => onNotifyScopeChange(opt.key)}
          >
            <span className="amenity-scope-label">{opt.label}</span>
            <span className="amenity-scope-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </EditField>
    {notifyScope === 'one' && (
      <EditField label="Chọn đối tác" required>
        <select
          className="search-input"
          value={partnerId}
          onChange={(e) => onPartnerIdChange(e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value="">-- Chọn đối tác --</option>
          {partners.map((p) => (
            <option key={p.ma_doi_tac} value={p.ma_doi_tac}>
              {p.ten_cong_ty}
            </option>
          ))}
        </select>
      </EditField>
    )}
  </div>
);

export default AmenityPartnerNotifyFields;
