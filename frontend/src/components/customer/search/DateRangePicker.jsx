import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { buildMonthGrid } from '../../../utils/calendar';
import { formatVN, todayStr } from '../../../utils/formatDate';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

const DateRangePicker = ({
  ngayNhan,
  ngayTra,
  open,
  onOpenChange,
  onChange,
  onCloseOther,
}) => {
  const ref = useRef(null);
  const [selecting, setSelecting] = useState('start');
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

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

  const shiftMonth = (delta) => {
    const date = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const handleDayClick = (dateStr) => {
    if (dateStr < todayStr()) return;

  if (selecting === 'start') {
    onChange({
      ngay_nhan: dateStr,
      ngay_tra: '',
    });

    setSelecting('end');
    return;
  }

  if (dateStr <= ngayNhan) {
    onChange({
      ngay_nhan: dateStr,
      ngay_tra: '',
    });

    setSelecting('end');
    return;
  }

  onChange({
    ngay_nhan: ngayNhan,
    ngay_tra: dateStr,
  });

  setSelecting('start');
  };

  const renderMonth = (year, month) => {
    const days = buildMonthGrid(year, month);

    return (
      <div className="calendar-month" key={`${year}-${month}`}>
        <div className="calendar-month-title">{monthLabel(year, month)}</div>
        <div className="calendar-weekdays">
          {WEEKDAYS.map((label) => (
            <span key={label} className={`calendar-weekday${label === 'CN' ? ' calendar-weekday-sun' : ''}`}>
              {label}
            </span>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((dateStr, idx) => {
            if (!dateStr) return <span key={`empty-${idx}`} className="day empty" />;
            const isStart = dateStr === ngayNhan;
            const isEnd = dateStr === ngayTra;
            const inRange = ngayNhan && ngayTra && dateStr > ngayNhan && dateStr < ngayTra;
            const isDisabled = dateStr < todayStr();

            return (
              <button
                key={dateStr}
                type="button"
                className={[
                  'day',
                  isStart && 'day-start',
                  isEnd && 'day-end',
                  inRange && 'day-in-range',
                  ngayNhan && ngayTra && (isStart || isEnd) && 'day-has-range',
                  isDisabled && 'day-disabled',
                ].filter(Boolean).join(' ')}
                disabled={isDisabled}
                onClick={() => handleDayClick(dateStr)}
              >
                {Number(dateStr.split('-')[2])}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const triggerLabel = ngayNhan && ngayTra
    ? `${formatVN(ngayNhan)} - ${formatVN(ngayTra)}`
    : 'Chọn ngày nhận và trả phòng';

  return (
    <div className="search-picker" ref={ref}>
      <button type="button" className="search-picker-trigger" onClick={handleToggle}>
        <Calendar size={18} className="search-picker-icon" />
        <span>{triggerLabel}</span>
      </button>

      {open && (
        <div className="date-range-dropdown">
          <div className="date-range-dropdown-title">Ngày ở</div>
          <div className="date-range-summary">
            <div>
              <span className="date-range-summary-label">Nhận phòng</span>
              <strong>{ngayNhan ? formatVN(ngayNhan) : '—'}</strong>
            </div>
            <div>
              <span className="date-range-summary-label">Trả phòng</span>
              <strong>{ngayTra ? formatVN(ngayTra) : '—'}</strong>
            </div>
          </div>

          <div className="calendar-nav">
            <button type="button" className="calendar-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Tháng trước">
              ‹
            </button>
            <button type="button" className="calendar-nav-btn" onClick={() => shiftMonth(1)} aria-label="Tháng sau">
              ›
            </button>
          </div>

          <div className="calendar-months">
            {renderMonth(viewYear, viewMonth)}
            {renderMonth(nextYear, nextMonth)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
