import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import GuestBedPicker from './GuestBedPicker';
import CustomerSearchButton from '../CustomerSearchButton';
import { saveSearchForm, resolveSearchForm, normalizeSearchGuests } from '../../../utils/hotelSearchStorage';

const todayStr = () => new Date().toISOString().split('T')[0];

const HotelSearchBar = ({
  locations = [],
  initialValues = {},
  onSearch,
  variant = 'page',
  className = '',
  searchButtonLabel = 'Tìm kiếm',
}) => {
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => resolveSearchForm(initialValues));

  useEffect(() => {
    setForm(resolveSearchForm(initialValues));
  }, [
    initialValues.ma_dia_diem,
    initialValues.ngay_nhan,
    initialValues.ngay_tra,
    initialValues.so_khach,
    initialValues.tre_em,
    initialValues.so_phong,
    initialValues.tuoi_tre_em,
  ]);

  const validate = (data) => {
    if (data.ngay_tra <= data.ngay_nhan) {
      setError('Ngày trả phòng phải sau ngày nhận phòng');
      return false;
    }
    if (data.ngay_nhan < todayStr()) {
      setError('Ngày nhận phòng không được ở quá khứ');
      return false;
    }
    setError('');
    return true;
  };

  const normalizeForm = (data) => {
    const guests = normalizeSearchGuests(data);
    return {
      ma_dia_diem: data.ma_dia_diem || '',
      ngay_nhan: data.ngay_nhan,
      ngay_tra: data.ngay_tra,
      ...guests,
    };
  };

  const updateForm = (patch) => {
    setForm((prev) => {
      const next = normalizeForm({ ...prev, ...patch });
      saveSearchForm(next);
      return next;
    });
  };

  const handleSubmit = () => {
    const data = normalizeForm(form);
    if (!validate(data)) return;
    saveSearchForm(data);
    onSearch(data);
  };

  const isHero = variant === 'hero';

  const bar = (
    <div className={`home-search-card home-search-card--split${isHero ? ' home-search-card--hero' : ''}`}>
      <div className="home-search-form">
        <div className="home-search-field home-search-field--location">
          <label className="home-search-label" htmlFor="hotel-search-location">
            Địa điểm
          </label>
          <div className="home-search-box">
            <MapPin size={18} strokeWidth={1.75} className="home-search-box-icon" aria-hidden />
            <select
              id="hotel-search-location"
              className="home-search-select"
              value={form.ma_dia_diem}
              onChange={(e) => updateForm({ ma_dia_diem: e.target.value })}
            >
              <option value="">Tất cả địa điểm</option>
              {locations.map((loc) => (
                <option key={loc.ma_dia_diem} value={loc.ma_dia_diem}>
                  {loc.ten_dia_diem}{loc.tinh_thanh ? `, ${loc.tinh_thanh}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="home-search-field home-search-field--dates">
          <span className="home-search-label">Ngày nhận phòng và trả phòng</span>
          <div className="home-search-box">
            <DateRangePicker
              ngayNhan={form.ngay_nhan}
              ngayTra={form.ngay_tra}
              open={dateOpen}
              onOpenChange={setDateOpen}
              onChange={({ ngay_nhan, ngay_tra }) => updateForm({ ngay_nhan, ngay_tra })}
              onCloseOther={() => setGuestOpen(false)}
            />
          </div>
        </div>

        <div className="home-search-field home-search-field--guests">
          <span className="home-search-label">Khách và phòng</span>
          <div className="home-search-box">
            <GuestBedPicker
              soKhach={form.so_khach}
              treEm={form.tre_em}
              soPhong={form.so_phong}
              tuoiTreEm={form.tuoi_tre_em}
              open={guestOpen}
              onOpenChange={setGuestOpen}
              onChange={(patch) => updateForm(patch)}
              onCloseOther={() => setDateOpen(false)}
            />
          </div>
        </div>

        <div className="home-search-btn-wrap">
          <CustomerSearchButton onClick={handleSubmit} showIcon>
            {searchButtonLabel}
          </CustomerSearchButton>
        </div>
      </div>

      {error && (
        <div className="home-search-footer">
          <div className="home-search-error">{error}</div>
        </div>
      )}
    </div>
  );

  if (isHero) {
    return (
      <div className={`home-search-section ${className}`.trim()}>
        <div className="home-search-wrap">
          {bar}
        </div>
      </div>
    );
  }

  return (
    <div className={`home-search-wrap hotel-search-bar-wrap search-page-bar ${className}`.trim()}>
      {bar}
    </div>
  );
};

export default HotelSearchBar;
