import { useEffect, useRef } from 'react';
import { Users, Baby, DoorOpen } from 'lucide-react';
import { normalizeSearchGuests } from '../../../utils/hotelSearchStorage';

const MAX_ADULTS = 10;
const MAX_CHILDREN = 6;
const MAX_ROOMS = 5;

const CounterRow = ({ icon: Icon, label, value, min, max, onDecrease, onIncrease }) => (
  <div className="guest-bed-row">
    <div className="guest-bed-row-leading">
      {Icon && <Icon size={20} strokeWidth={1.75} className="guest-bed-row-icon" aria-hidden />}
      <span className="guest-bed-row-label">{label}</span>
    </div>
    <div className="home-guest-control">
      <button
        type="button"
        className="home-guest-btn"
        disabled={value <= min}
        onClick={onDecrease}
      >
        −
      </button>
      <span className="home-guest-value">{value}</span>
      <button
        type="button"
        className="home-guest-btn"
        disabled={value >= max}
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  </div>
);

const GuestBedPicker = ({
  soKhach,
  treEm,
  soPhong,
  open,
  onOpenChange,
  onChange,
  onCloseOther,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  const handleToggle = () => {
    onCloseOther?.();
    onOpenChange(!open);
  };

  const applyChange = (patch) => {
    onChange(normalizeSearchGuests({
      so_khach: soKhach,
      tre_em: treEm,
      so_phong: soPhong,
      ...patch,
    }));
  };

  const maxRooms = Math.min(MAX_ROOMS, soKhach);

  return (
    <div className="search-picker" ref={ref}>
      <button type="button" className="search-picker-trigger" onClick={handleToggle}>
        <Users size={18} className="search-picker-icon" />
        <span className="search-picker-label">
          {soKhach} người lớn, {treEm} trẻ em, {soPhong} phòng
        </span>
      </button>

      {open && (
        <div className="guest-bed-dropdown">
          <CounterRow
            icon={Users}
            label="Người lớn"
            value={soKhach}
            min={1}
            max={MAX_ADULTS}
            onDecrease={() => applyChange({ so_khach: soKhach - 1 })}
            onIncrease={() => applyChange({ so_khach: soKhach + 1 })}
          />
          <CounterRow
            icon={Baby}
            label="Trẻ em"
            value={treEm}
            min={0}
            max={MAX_CHILDREN}
            onDecrease={() => applyChange({ tre_em: treEm - 1 })}
            onIncrease={() => applyChange({ tre_em: treEm + 1 })}
          />
          <CounterRow
            icon={DoorOpen}
            label="Phòng"
            value={soPhong}
            min={1}
            max={maxRooms}
            onDecrease={() => applyChange({ so_phong: soPhong - 1 })}
            onIncrease={() => applyChange({ so_phong: soPhong + 1 })}
          />
          <div className="guest-bed-dropdown-footer">
            <button type="button" className="guest-bed-done-btn" onClick={() => onOpenChange(false)}>
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBedPicker;
