import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import '../../../assets/styles/pricing-calendar.css';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const formatPriceShort = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));

const parseCurrency = (s) =>
  Number(String(s).replace(/\./g, '').replace(/,/g, ''));

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(`${String(d).slice(0, 10)}T12:00:00`);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizeNgay = (ngay) => {
  if (!ngay) return '';
  if (typeof ngay === 'string') {
    const part = ngay.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
    return toDateKey(new Date(ngay));
  }
  return toDateKey(ngay);
};

const getDefaultLoaiGia = (dateStr) => {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 || day === 6 ? 'cuoi_tuan' : 'co_ban';
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('vi-VN');
};

const getInclusiveDayCount = (from, to) => {
  if (!from || !to) return 0;
  return getDatesInRange(from, to).length;
};

const getDatesInRange = (from, to) => {
  const dates = [];
  const cur = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cur <= end) {
    dates.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const buildMonthWeeks = (year, month) => {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let pad = first.getDay() - 1;
  if (pad < 0) pad = 6;

  const cells = [];
  for (let i = 0; i < pad; i += 1) cells.push(null);
  for (let d = 1; d <= lastDay; d += 1) {
    const m = String(month + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    cells.push(`${year}-${m}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const isInRange = (dateStr, from, to) => {
  if (!from || !to) return false;
  return dateStr >= from && dateStr <= to;
};

const MonthCalendar = ({
  year,
  month,
  dayMap,
  selectedFrom,
  selectedTo,
  today,
  onDayClick,
}) => {
  const weeks = buildMonthWeeks(year, month);

  return (
    <table className="price-inv-table">
      <thead>
        <tr>
          {WEEKDAYS.map((d, i) => (
            <th key={d} className={i === 6 ? 'sun' : ''}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, wi) => (
          <tr key={`w-${wi}`}>
            {week.map((dateStr, di) => {
              if (!dateStr) {
                return <td key={`e-${wi}-${di}`} className="empty" />;
              }

              const info = dayMap[dateStr];
              const isPast = dateStr < today;
              const selected = isInRange(dateStr, selectedFrom, selectedTo);
              const isCustom = info?.gia_tuy_chinh;
              const dayNum = parseInt(dateStr.slice(8), 10);

              return (
                <td key={dateStr} className={selected ? 'selected' : ''}>
                  <button
                    type="button"
                    className="price-inv-cell-btn"
                    onClick={() => !isPast && onDayClick(dateStr)}
                    disabled={isPast}
                  >
                    <span className="price-inv-cell-left">
                      <span className="price-inv-cell-day">{dayNum}</span>
                    </span>
                    <span className="price-inv-cell-right">
                      {info ? (
                        <>
                          <span className={`price-inv-cell-price ${isCustom || selected ? 'custom' : ''}`}>
                            {formatPriceShort(info.don_gia)}
                          </span>
                          <span className="price-inv-cell-inv">
                            {info.con_lai}/{info.tong_phong} Phòng
                          </span>
                        </>
                      ) : (
                        <span className="price-inv-cell-price">—</span>
                      )}
                    </span>
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const PricingPage = () => {
  const now = new Date();
  const today = toDateKey(now);

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [calendarData, setCalendarData] = useState({ room: null, days: [] });
  const [loading, setLoading] = useState(false);

  const [rangeAnchor, setRangeAnchor] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedTo, setSelectedTo] = useState('');

  const [donGia, setDonGia] = useState('');
  const [moBan, setMoBan] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    api.get('/partner/pricing/hotels').then((res) => {
      setHotels(res.data.data || []);
    }).catch(() => showToast('Không tải được danh sách khách sạn', 'error'));
  }, []);

  useEffect(() => {
    if (!selectedHotel) {
      setRooms([]);
      setSelectedRoom('');
      return;
    }
    const hotel = hotels.find((h) => h.ma_khach_san === Number(selectedHotel));
    const list = hotel?.loai_phong || [];
    setRooms(list);
    setSelectedRoom(list[0] ? String(list[0].ma_loai_phong) : '');
    setRangeAnchor(null);
    setSelectedFrom('');
    setSelectedTo('');
  }, [selectedHotel, hotels]);

  const rangeStart = useMemo(() => {
    const m = String(viewMonth + 1).padStart(2, '0');
    return `${viewYear}-${m}-01`;
  }, [viewYear, viewMonth]);

  const rangeEnd = useMemo(() => {
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(lastDay).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  }, [viewYear, viewMonth]);

  const monthLabel = `Tháng ${viewMonth + 1} / ${viewYear}`;

  const loadCalendar = useCallback(async () => {
    if (!selectedRoom) {
      setCalendarData({ room: null, days: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/partner/pricing/management-calendar', {
        params: {
          maLoaiPhong: selectedRoom,
          tuNgay: rangeStart,
          denNgay: rangeEnd,
        },
      });
      const data = res.data.data || { room: null, days: [] };
      setCalendarData(data);
      if (data.room) {
        const defaultQty = data.room.mo_ban > 0 ? data.room.mo_ban : data.room.tong_phong;
        setMoBan(String(defaultQty));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải lịch', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, rangeStart, rangeEnd]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const dayMap = useMemo(() => {
    const map = {};
    (calendarData.days || []).forEach((d) => {
      map[normalizeNgay(d.ngay)] = d;
    });
    return map;
  }, [calendarData.days]);

  const selectedDayCount = useMemo(
    () => getInclusiveDayCount(selectedFrom, selectedTo),
    [selectedFrom, selectedTo],
  );

  const handleFromDateChange = (value) => {
    setSelectedFrom(value);
    setRangeAnchor(null);
    if (value && selectedTo && value > selectedTo) {
      setSelectedTo(value);
    }
  };

  const handleToDateChange = (value) => {
    setSelectedTo(value);
    setRangeAnchor(null);
    if (value && selectedFrom && value < selectedFrom) {
      setSelectedFrom(value);
    }
  };

  const handleDayClick = (dateStr) => {
    if (!rangeAnchor) {
      setRangeAnchor(dateStr);
      setSelectedFrom(dateStr);
      setSelectedTo(dateStr);
      const info = dayMap[dateStr];
      if (info) {
        setDonGia(formatCurrency(info.don_gia));
        if (info.so_luong_ap_dung != null) {
          setMoBan(String(info.so_luong_ap_dung));
        }
      }
      return;
    }

    if (dateStr < rangeAnchor) {
      setSelectedFrom(dateStr);
      setSelectedTo(rangeAnchor);
    } else {
      setSelectedFrom(rangeAnchor);
      setSelectedTo(dateStr);
    }
    setRangeAnchor(null);

    const info = dayMap[dateStr];
    if (info) {
      setDonGia(formatCurrency(info.don_gia));
      if (info.so_luong_ap_dung != null) {
        setMoBan(String(info.so_luong_ap_dung));
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setRangeAnchor(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setRangeAnchor(null);
  };

  const handleSave = async () => {
    if (!selectedRoom || !selectedFrom || !selectedTo) {
      return showToast('Chọn khoảng ngày trên lịch', 'error');
    }

    const priceValue = parseCurrency(donGia);
    if (!priceValue || priceValue <= 0) {
      return showToast('Nhập giá hợp lệ', 'error');
    }

    const roomInfo = calendarData.room;
    const moBanValue = Number(moBan);
    if (Number.isNaN(moBanValue) || moBanValue < 1) {
      return showToast('Số phòng áp dụng giá phải từ 1', 'error');
    }
    if (moBanValue > Number(roomInfo?.tong_phong || 0)) {
      return showToast(`Số phòng áp dụng không được vượt quá tổng phòng (${roomInfo.tong_phong})`, 'error');
    }

    const giaCoBan = Number(roomInfo?.gia_co_ban || 0);
    const dates = getDatesInRange(selectedFrom, selectedTo);

    const entries = [];
    const toDelete = [];

    dates.forEach((ngay) => {
      if (priceValue !== giaCoBan) {
        entries.push({
          ma_loai_phong: Number(selectedRoom),
          ngay,
          don_gia: priceValue,
          loai_gia: getDefaultLoaiGia(ngay),
          so_luong_ap_dung: moBanValue,
        });
      } else {
        toDelete.push({ ma_loai_phong: Number(selectedRoom), ngay });
      }
    });

    setSaving(true);
    try {
      if (entries.length > 0) {
        await api.post('/partner/pricing/save', { entries });
      }
      if (toDelete.length > 0) {
        await api.post('/partner/pricing/delete-bulk', { items: toDelete });
      }

      showToast('Đã cập nhật giá theo ngày');
      setRangeAnchor(null);
      await loadCalendar();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi lưu dữ liệu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tongPhong = calendarData.room?.tong_phong ?? 0;

  return (
    <div className="mgmt-page price-inv-page">
      <ManagementHeader
        title="Quản lý giá và kho phòng"
        subtitle="Đặt giá theo ngày và số phòng áp dụng giá đó. Thêm loại phòng mới sẽ tự mở bán toàn bộ."
      />

      <Toast toast={toast} />

      <div className="price-inv-toolbar">
        <div className="field">
          <label>Chọn khách sạn</label>
          <select
            className="search-input"
            style={{ width: '10%' }}
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
          >
            <option value="">-- Chọn khách sạn --</option>
            {hotels.map((h) => (
              <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Chọn loại phòng</label>
          <select
            className="search-input"
            style={{ width: '10%' }}
            value={selectedRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              setRangeAnchor(null);
              setSelectedFrom('');
              setSelectedTo('');
            }}
            disabled={!selectedHotel}
          >
            <option value="">-- Chọn loại phòng --</option>
            {rooms.map((r) => (
              <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedRoom ? (
        <div className="content-card price-inv-empty">
          Chọn khách sạn và loại phòng để xem lịch giá & kho
        </div>
      ) : (
        <div className="price-inv-body">
          <div className="price-inv-calendar-wrap">
            <div className="price-inv-nav">
              <button type="button" onClick={prevMonth}>← Tháng trước</button>
              <div className="price-inv-nav-center">
                <span className="price-inv-month-title">{monthLabel}</span>
                {loading && <span className="price-inv-loading">Đang tải...</span>}
              </div>
              <button type="button" onClick={nextMonth}>Tháng sau →</button>
            </div>
            <MonthCalendar
              year={viewYear}
              month={viewMonth}
              dayMap={dayMap}
              selectedFrom={selectedFrom}
              selectedTo={selectedTo}
              today={today}
              onDayClick={handleDayClick}
            />

            <div className="price-inv-legend price-inv-legend--horizontal">
              <strong>Chú thích:</strong>
              <div className="price-inv-legend-item">
                <span className="price-inv-legend-dot-inline price-inv-legend-dot-inline--green" />
                Giá cơ bản
              </div>
              <div className="price-inv-legend-item">
                <span className="price-inv-legend-dot-inline price-inv-legend-dot-inline--red" />
                Giá chỉnh sửa
              </div>
              <div className="price-inv-legend-item">
                <span className="price-inv-legend-dot-inline price-inv-legend-dot-inline--blue" />
                Còn lại / tổng phòng
              </div>
              <div className="price-inv-legend-item">
                <span className="price-inv-legend-swatch price-inv-legend-swatch--sel" />
                Ô đang chọn
              </div>
            </div>
          </div>

          <aside className="price-inv-panel">
            <h3>Ngày áp giá</h3>
            <div className="price-inv-panel-section">
              <div className="price-inv-date-row">
                <span>Từ</span>
                <input
                  type="date"
                  value={selectedFrom}
                  min={today}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                />
              </div>
              <div className="price-inv-date-row">
                <span>Đến</span>
                <input
                  type="date"
                  value={selectedTo}
                  min={selectedFrom || today}
                  onChange={(e) => handleToDateChange(e.target.value)}
                />
              </div>
              {selectedFrom && selectedTo && (
                <p className="price-inv-hint">
                  Áp dụng cho {selectedDayCount} ngày (từ {formatDisplayDate(selectedFrom)} đến {formatDisplayDate(selectedTo)}, bao gồm cả hai ngày)
                </p>
              )}
            </div>

            <div className="price-inv-panel-section">
              <h3>Giá phòng </h3>
              <div className="form-row">
                <label>Đơn giá (VNĐ)</label>
                <input
                  type="text"
                  value={donGia}
                  onChange={(e) => setDonGia(formatCurrency(parseCurrency(e.target.value)))}
                  placeholder="Nhập giá"
                />
                {calendarData.room && (
                  <p className="price-inv-hint">
                    Giá cơ bản: {formatCurrency(calendarData.room.gia_co_ban)} đ
                  </p>
                )}
              </div>
            </div>

            <div className="price-inv-panel-section">
              <h3>Sét phòng áp dụng giá</h3>
              <div className="form-row">
                <label>Số phòng</label>
                <input
                  type="number"
                  min={1}
                  max={tongPhong}
                  value={moBan}
                  onChange={(e) => setMoBan(e.target.value)}
                />
                <p className="price-inv-hint">
                  Áp dụng giá trên cho {moBan || '—'} / {tongPhong} phòng trong khoảng ngày đã chọn
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}
              onClick={handleSave}
              disabled={saving || !selectedFrom || !selectedTo}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
