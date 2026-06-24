import { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';

const CounterRow = ({ label, value, min, max, onDecrease, onIncrease }) => (
  <div className="guest-bed-row">
    <span className="guest-bed-row-label">{label}</span>
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
  soGiuong,
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

  
  return (
    <div className="search-picker" ref={ref}>
      <button type="button" className="search-picker-trigger" onClick={handleToggle}>
        <Users size={18} className="search-picker-icon" />
            <span className="search-picker-label">
      <span>{soKhach} người lớn, {treEm} trẻ em</span>
      <span>{soGiuong} giường</span>
      </span>
      </button>

      {open && (
        <div className="guest-bed-dropdown">
          <CounterRow
            label="Người lớn"
            value={soKhach}
            min={1}
            max={10}
            onDecrease={() => onChange({ so_khach: Math.max(1, soKhach - 1) })}
            onIncrease={() => onChange({ so_khach: Math.min(10, soKhach + 1) })}
          />
          <CounterRow
            label="Trẻ em"
            value={treEm}
            min={0}
            max={6}
            onDecrease={() => onChange({ tre_em: Math.max(0, treEm - 1) })}
            onIncrease={() => onChange({ tre_em: Math.min(6, treEm + 1) })}
          />
          <CounterRow
            label="Số giường"
            value={soGiuong}
            min={1}
            max={5}
            onDecrease={() => onChange({ so_giuong: Math.max(1, soGiuong - 1) })}
            onIncrease={() => onChange({ so_giuong: Math.min(5, soGiuong + 1) })}
          />
        </div>
      )}
    </div>
  );
};

export default GuestBedPicker;
