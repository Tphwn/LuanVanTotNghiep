import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import { getHotelStatusMeta } from '../../../constants/statusConfig';
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

const getInclusiveDayCount = (from, to) => {
  if (!from || !to) return 0;
  return getDatesInRange(from, to).length;
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

const getActiveRooms = (hotel) =>
  (hotel?.loai_phong || []).filter((r) => r.trang_thai === 'hoat_dong' || !r.trang_thai);

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
  const [listLoading, setListLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [detailHotelId, setDetailHotelId] = useState(null);
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
  const [fieldErrors, setFieldErrors] = useState({});
  const { toast, showToast } = useToast();

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    setListLoading(true);
    api.get('/partner/pricing/hotels')
      .then((res) => setHotels(res.data.data || []))
      .catch(() => showToast('Không tải được danh sách khách sạn', 'error'))
      .finally(() => setListLoading(false));
  }, [showToast]);

  const detailHotel = useMemo(
    () => hotels.find((h) => h.ma_khach_san === Number(detailHotelId)) || null,
    [hotels, detailHotelId],
  );

  const rooms = useMemo(() => getActiveRooms(detailHotel), [detailHotel]);

  const filteredHotels = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return hotels;
    return hotels.filter((hotel) => (
      hotel.ten?.toLowerCase().includes(text)
      || hotel.dia_chi?.toLowerCase().includes(text)
      || hotel.dia_diem?.ten_dia_diem?.toLowerCase().includes(text)
    ));
  }, [hotels, keyword]);

  const {
    pagedItems: pagedHotels,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(filteredHotels, 10, [keyword]);

  const openDetail = (hotel) => {
    const activeRooms = getActiveRooms(hotel);
    setDetailHotelId(hotel.ma_khach_san);
    setSelectedRoom(activeRooms[0] ? String(activeRooms[0].ma_loai_phong) : '');
    setRangeAnchor(null);
    setSelectedFrom('');
    setSelectedTo('');
    setDonGia('');
    setFieldErrors({});
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleHotelFilterChange = (hotelId) => {
    const hotel = hotels.find((h) => String(h.ma_khach_san) === String(hotelId));
    if (!hotel) return;
    openDetail(hotel);
  };

  const closeDetail = () => {
    setDetailHotelId(null);
    setSelectedRoom('');
    setCalendarData({ room: null, days: [] });
    setRangeAnchor(null);
    setSelectedFrom('');
    setSelectedTo('');
    setDonGia('');
    setFieldErrors({});
  };

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
  }, [selectedRoom, rangeStart, rangeEnd, showToast]);

  useEffect(() => {
    if (detailHotelId) loadCalendar();
  }, [detailHotelId, loadCalendar]);

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
    clearFieldError('selectedFrom');
    clearFieldError('selectedTo');
    setRangeAnchor(null);
    if (value && selectedTo && value > selectedTo) {
      setSelectedTo(value);
    }
  };

  const handleToDateChange = (value) => {
    setSelectedTo(value);
    clearFieldError('selectedFrom');
    clearFieldError('selectedTo');
    setRangeAnchor(null);
    if (value && selectedFrom && value < selectedFrom) {
      setSelectedFrom(value);
    }
  };

  const handleDayClick = (dateStr) => {
    clearFieldError('selectedFrom');
    clearFieldError('selectedTo');
    if (!rangeAnchor) {
      setRangeAnchor(dateStr);
      setSelectedFrom(dateStr);
      setSelectedTo(dateStr);
      const info = dayMap[dateStr];
      if (info) {
        setDonGia(formatCurrency(info.don_gia));
        clearFieldError('donGia');
        if (info.so_luong_ap_dung != null) {
          setMoBan(String(info.so_luong_ap_dung));
          clearFieldError('moBan');
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
      clearFieldError('donGia');
      if (info.so_luong_ap_dung != null) {
        setMoBan(String(info.so_luong_ap_dung));
        clearFieldError('moBan');
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

  const validateSave = () => {
    const errors = {};

    if (!selectedRoom) {
      errors.selectedRoom = 'Loại phòng là bắt buộc';
    }

    if (!selectedFrom) {
      errors.selectedFrom = 'Ngày bắt đầu là bắt buộc';
    } else if (selectedFrom < today) {
      errors.selectedFrom = 'Không thể chọn ngày đã qua';
    }

    if (!selectedTo) {
      errors.selectedTo = 'Ngày kết thúc là bắt buộc';
    }

    if (selectedFrom && selectedTo && selectedFrom > selectedTo) {
      errors.selectedTo = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
    }

    const priceRaw = String(donGia ?? '').trim();
    if (!priceRaw) {
      errors.donGia = 'Đơn giá là bắt buộc';
    } else {
      const priceValue = parseCurrency(priceRaw);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        errors.donGia = 'Đơn giá không hợp lệ';
      } else if (priceValue < 1000) {
        errors.donGia = 'Đơn giá phải từ 1.000 VNĐ trở lên';
      }
    }

    const moBanRaw = String(moBan ?? '').trim();
    if (!moBanRaw) {
      errors.moBan = 'Số phòng là bắt buộc';
    } else {
      const moBanValue = Number(moBanRaw);
      if (!Number.isInteger(moBanValue) || moBanValue <= 0) {
        errors.moBan = 'Số phòng phải lớn hơn 0';
      } else {
        const tongPhongHienTai = Number(calendarData.room?.tong_phong || 0);
        if (tongPhongHienTai > 0 && moBanValue > tongPhongHienTai) {
          errors.moBan = `Số phòng không được vượt quá ${tongPhongHienTai}`;
        }
      }
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateSave();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Lưu không thành công. Vui lòng kiểm tra lại thông tin.', 'error');
      return;
    }

    setFieldErrors({});
    const priceValue = parseCurrency(donGia);
    const moBanValue = Number(moBan);
    const roomInfo = calendarData.room;
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

      showToast('Lưu thay đổi thành công');
      setRangeAnchor(null);
      await loadCalendar();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lưu không thành công. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tongPhong = calendarData.room?.tong_phong ?? 0;

  if (!detailHotelId) {
    return (
      <div className="mgmt-page mgmt-list-page">
        <ManagementHeader
          title="Quản lý giá và kho phòng"
          subtitle="Danh sách khách sạn đang quản lý — chọn xem chi tiết để chỉnh giá theo ngày"
        />

        <Toast toast={toast} />

        <ManagementToolbar
          searchValue={keyword}
          onSearchChange={(e) => setKeyword(e.target.value)}
          searchPlaceholder="Tìm theo tên khách sạn, địa điểm hoặc địa chỉ..."
        />

        <div className="mgmt-table-card mgmt-table-card--grid">
          {listLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
          ) : filteredHotels.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">
                {hotels.length
                  ? 'Không có khách sạn phù hợp bộ lọc'
                  : 'Chưa có khách sạn nào đang hoạt động để quản lý giá.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mgmt-table-scroll">
                <table className="data-table data-table-grid">
                  <thead>
                    <tr>
                      <th>Tên khách sạn</th>
                      <th>Địa điểm</th>
                      <th>Địa chỉ</th>
                      <th style={{ width: 120 }}>Loại phòng</th>
                      <th style={{ width: 140 }}>Trạng thái</th>
                      <th style={{ width: 100 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHotels.map((hotel) => {
                      const st = getHotelStatusMeta(hotel, { variant: 'badge' });
                      const roomCount = hotel._count?.loai_phong
                        ?? hotel.loai_phong?.length
                        ?? 0;
                      const activeCount = getActiveRooms(hotel).length;
                      return (
                        <tr key={hotel.ma_khach_san}>
                          <td>
                            <strong>{hotel.ten}</strong>
                          </td>
                          <td>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                          <td>{hotel.dia_chi || '—'}</td>
                          <td>
                            {activeCount > 0
                              ? `${activeCount}${roomCount !== activeCount ? ` / ${roomCount}` : ''}`
                              : roomCount}
                          </td>
                          <td>
                            <span className={`badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <ActionCell>
                            <ActionButton
                              variant="view"
                              iconOnly
                              icon={Eye}
                              title="Xem chi tiết"
                              onClick={() => openDetail(hotel)}
                              disabled={activeCount === 0}
                            />
                          </ActionCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {showPagination && (
                <ListPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  rangeFrom={rangeFrom}
                  rangeTo={rangeTo}
                  totalItems={filteredHotels.length}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page price-inv-page">
      <ManagementHeader
        title="Quản lý giá và kho phòng"
        subtitle={detailHotel?.ten || 'Chi tiết lịch giá'}
        onBack={closeDetail}
      />
      <Toast toast={toast} />

      <div className="price-inv-toolbar">
        <div className="field">
          <label>Khách sạn</label>
          <select
            className="search-input"
            value={detailHotelId || ''}
            onChange={(e) => handleHotelFilterChange(e.target.value)}
          >
            {hotels.map((h) => (
              <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Chọn loại phòng <span style={{ color: '#e05c5c' }}>*</span></label>
          <select
            className={`search-input${fieldErrors.selectedRoom ? ' input-invalid' : ''}`}
            value={selectedRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              clearFieldError('selectedRoom');
              setRangeAnchor(null);
              setSelectedFrom('');
              setSelectedTo('');
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.selectedFrom;
                delete next.selectedTo;
                return next;
              });
            }}
          >
            <option value="">-- Chọn loại phòng --</option>
            {rooms.map((r) => (
              <option key={r.ma_loai_phong} value={r.ma_loai_phong}>
                {r.ten_loai}
              </option>
            ))}
          </select>
          {fieldErrors.selectedRoom && (
            <p className="form-field-error">{fieldErrors.selectedRoom}</p>
          )}
        </div>
      </div>

      {!selectedRoom ? (
        <div className="content-card price-inv-empty">
          Chọn loại phòng để xem lịch giá &amp; kho
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
                <span>Từ <span style={{ color: '#e05c5c' }}>*</span></span>
                <input
                  type="date"
                  className={fieldErrors.selectedFrom ? 'input-invalid' : ''}
                  value={selectedFrom}
                  min={today}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                />
              </div>
              {fieldErrors.selectedFrom && (
                <p className="form-field-error">{fieldErrors.selectedFrom}</p>
              )}
              <div className="price-inv-date-row">
                <span>Đến <span style={{ color: '#e05c5c' }}>*</span></span>
                <input
                  type="date"
                  className={fieldErrors.selectedTo ? 'input-invalid' : ''}
                  value={selectedTo}
                  min={selectedFrom || today}
                  onChange={(e) => handleToDateChange(e.target.value)}
                />
              </div>
              {fieldErrors.selectedTo && (
                <p className="form-field-error">{fieldErrors.selectedTo}</p>
              )}
              {selectedFrom && selectedTo && !fieldErrors.selectedFrom && !fieldErrors.selectedTo && (
                <p className="price-inv-hint">
                  Áp dụng cho {selectedDayCount} ngày (từ {formatDisplayDate(selectedFrom)} đến {formatDisplayDate(selectedTo)}, bao gồm cả hai ngày)
                </p>
              )}
            </div>

            <div className="price-inv-panel-section">
              <h3>Giá phòng</h3>
              <div className="form-row">
                <label>Đơn giá (VNĐ) <span style={{ color: '#e05c5c' }}>*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={fieldErrors.donGia ? 'input-invalid' : ''}
                  value={donGia}
                  onChange={(e) => {
                    setDonGia(formatCurrency(parseCurrency(e.target.value)));
                    clearFieldError('donGia');
                  }}
                  placeholder="Tối thiểu 1.000"
                />
                {fieldErrors.donGia ? (
                  <p className="form-field-error">{fieldErrors.donGia}</p>
                ) : (
                  <p className="price-inv-hint">
                    {calendarData.room ? ` · Giá cơ bản: ${formatCurrency(calendarData.room.gia_co_ban)} đ` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="price-inv-panel-section">
              <h3>Sét phòng áp dụng giá</h3>
              <div className="form-row">
                <label>Số phòng <span style={{ color: '#e05c5c' }}>*</span></label>
                <input
                  type="number"
                  min={1}
                  max={tongPhong || undefined}
                  className={fieldErrors.moBan ? 'input-invalid' : ''}
                  value={moBan}
                  onChange={(e) => {
                    setMoBan(e.target.value);
                    clearFieldError('moBan');
                  }}
                  placeholder="Lớn hơn 0"
                />
                {fieldErrors.moBan ? (
                  <p className="form-field-error">{fieldErrors.moBan}</p>
                ) : (
                  <p className="price-inv-hint">
                    Số phòng phải &gt; 0
                    {tongPhong > 0 ? ` và ≤ ${tongPhong}` : ''}
                    {' · '}Áp dụng: {moBan || '—'} / {tongPhong || '—'} phòng
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}
              onClick={handleSave}
              disabled={saving}
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
