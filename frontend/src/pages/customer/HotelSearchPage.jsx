import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import PriceRangeSlider from '../../components/customer/search/PriceRangeSlider';
import HotelSearchBar from '../../components/customer/search/HotelSearchBar';
import { groupHotelAmenities } from '../../utils/hotelAmenityFilters';
import { searchFormToParams } from '../../utils/hotelSearchStorage';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const stars = (n) => '★'.repeat(Math.max(0, Number(n) || 0));

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'stars_desc', label: 'Hạng sao cao nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
];

const STAR_OPTIONS = [5, 4, 3, 2, 1];

const ratingLabel = (score) => {
  if (!score) return '';
  if (score >= 4.5) return 'Xuất sắc';
  if (score >= 4) return 'Rất tốt';
  if (score >= 3.5) return 'Tốt';
  if (score >= 3) return 'Khá';
  return 'Trung bình';
};

const buildHotelDetailUrl = (hotelId, filters) => {
  const params = new URLSearchParams();
  if (filters.ma_dia_diem) params.set('ma_dia_diem', filters.ma_dia_diem);
  if (filters.ngay_nhan) params.set('ngay_nhan', filters.ngay_nhan);
  if (filters.ngay_tra) params.set('ngay_tra', filters.ngay_tra);
  if (filters.so_khach) params.set('so_khach', filters.so_khach);
  const qs = params.toString();
  return `/hotels/${hotelId}${qs ? `?${qs}` : ''}`;
};

const getHotelImage = (hotel) => {
  const imgs = hotel.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh) || imgs[0];
};

const FilterSidebar = ({
  priceRange,
  priceMin,
  priceMax,
  onPriceChange,
  onPriceReset,
  selectedStars,
  onToggleStar,
  amenityGroups,
  selectedAmenities,
  onToggleAmenity,
  onReset,
  hasActiveFilters,
  showSlider,
}) => (
  <aside className="search-filter-sidebar">
    <div className="search-filter-card">
      <div className="search-filter-header">
        <h3 className="search-filter-title">Bộ lọc</h3>
        {hasActiveFilters && (
          <button type="button" className="search-filter-reset" onClick={onReset}>
            Đặt lại
          </button>
        )}
      </div>

      <div className="search-filter-section">
        <label className="search-filter-label">Khoảng giá / đêm</label>
        {priceRange.max > priceRange.min && (
          <p className="search-filter-hint">
            {fmt(priceRange.min)} – {fmt(priceRange.max)} ₫
          </p>
        )}
        {showSlider && priceRange.max > priceRange.min ? (
          <PriceRangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={priceMin}
            valueMax={priceMax}
            onChange={({ min, max }) => onPriceChange(String(min), String(max))}
          />
        ) : (
          <p className="search-filter-hint">Chưa có dữ liệu giá để lọc</p>
        )}
        {showSlider && hasActiveFilters && (
          <button type="button" className="search-filter-reset" style={{ marginTop: 8 }} onClick={onPriceReset}>
            Đặt lại khoảng giá
          </button>
        )}
      </div>

      <div className="search-filter-section">
        <label className="search-filter-label">Hạng sao khách sạn</label>
        <div className="search-filter-checks">
          {STAR_OPTIONS.map((star) => (
            <label key={star} className="search-filter-check">
              <input
                type="checkbox"
                checked={selectedStars.includes(star)}
                onChange={() => onToggleStar(star)}
              />
              <span className="search-filter-stars">{stars(star)}</span>
            </label>
          ))}
        </div>
      </div>

      {amenityGroups.length > 0 && (
        <div className="search-filter-section search-filter-amenities">
          <label className="search-filter-label">Tiện nghi</label>
          <div className="search-filter-amenity-groups">
            {amenityGroups.map((group) => (
              <div key={group.id} className="search-filter-amenity-group">
                <div className="search-filter-amenity-group-title">{group.label}</div>
                <div className="search-filter-checks">
                  {group.items.map((amenity) => (
                    <label key={amenity.ma_tien_nghi} className="search-filter-check">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity.ma_tien_nghi)}
                        onChange={() => onToggleAmenity(amenity.ma_tien_nghi)}
                      />
                      {amenity.ten}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </aside>
);

const HotelRatingBadge = ({ score, count }) => {
  if (!count) {
    return <span className="hotel-result-rating-none">Chưa có đánh giá</span>;
  }
  return (
    <div className="hotel-result-rating">
      <span className="hotel-result-rating-score">{score}</span>
      <div className="hotel-result-rating-text">
        <span className="hotel-result-rating-label">{ratingLabel(score)}</span>
        <span className="hotel-result-rating-count">({count} đánh giá)</span>
      </div>
    </div>
  );
};

const HotelSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [amenityCatalog, setAmenityCatalog] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('price_asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedStars, setSelectedStars] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const filters = useMemo(() => ({
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
    ngay_nhan: searchParams.get('ngay_nhan') || '',
    ngay_tra: searchParams.get('ngay_tra') || '',
    so_khach: searchParams.get('so_khach') || '2',
    so_giuong: searchParams.get('so_giuong') || '1',
    tre_em: searchParams.get('tre_em') || '0',
    so_phong: searchParams.get('so_phong') || '1',
  }), [searchParams]);

  const hasDateSearch = Boolean(filters.ngay_nhan && filters.ngay_tra);
  const isSearchRoute = location.pathname === ROUTES.CUSTOMER.ROOM_SEARCH;

  const searchBarInitial = useMemo(() => {
    const init = {
      so_khach: Number(filters.so_khach) || 2,
      so_giuong: Number(filters.so_giuong) || 1,
      tre_em: Number(filters.tre_em) || 0,
      so_phong: Number(filters.so_phong) || 1,
    };
    if (filters.ma_dia_diem) init.ma_dia_diem = filters.ma_dia_diem;
    if (filters.ngay_nhan) init.ngay_nhan = filters.ngay_nhan;
    if (filters.ngay_tra) init.ngay_tra = filters.ngay_tra;
    return init;
  }, [filters]);

  useEffect(() => {
    if (
      location.pathname === ROUTES.CUSTOMER.HOTELS
      && searchParams.get('ngay_nhan')
      && searchParams.get('ngay_tra')
    ) {
      navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${searchParams.toString()}`, { replace: true });
    }
  }, [location.pathname, searchParams, navigate]);

  useEffect(() => {
    Promise.all([
      publicHotelService.getLocations(),
      publicHotelService.getAmenityFilters(),
    ])
      .then(([locRes, amenityRes]) => {
        setLocations(locRes.data?.data || []);
        setAmenityCatalog(amenityRes.data?.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setSelectedStars([]);
      setSelectedAmenities([]);
      setPriceMin('');
      setPriceMax('');
      try {
        const params = {
          ma_dia_diem: filters.ma_dia_diem || undefined,
          ngay_nhan: filters.ngay_nhan || undefined,
          ngay_tra: filters.ngay_tra || undefined,
          so_khach: filters.so_khach,
        };

        const res = (isSearchRoute && hasDateSearch)
          ? await publicHotelService.searchHotels(params)
          : await publicHotelService.listHotels({ ma_dia_diem: params.ma_dia_diem });

        setHotels(res.data?.data || []);
      } catch (err) {
        setHotels([]);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [
    filters.ma_dia_diem,
    filters.ngay_nhan,
    filters.ngay_tra,
    filters.so_khach,
    isSearchRoute,
    hasDateSearch,
  ]);

  const amenityGroups = useMemo(
    () => groupHotelAmenities(amenityCatalog),
    [amenityCatalog],
  );

  const priceRange = useMemo(() => {
    const prices = hotels.map((h) => h.gia_tu).filter(Boolean);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [hotels]);

  useEffect(() => {
    if (priceRange.max > priceRange.min && priceMin === '' && priceMax === '') {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    }
  }, [priceRange, priceMin, priceMax]);

  const applyPriceFilter = (list, getPrice) => {
    let result = [...list];
    if (priceMin !== '') {
      const min = Number(priceMin);
      result = result.filter((item) => getPrice(item) >= min);
    }
    if (priceMax !== '') {
      const max = Number(priceMax);
      result = result.filter((item) => getPrice(item) <= max);
    }
    return result;
  };

  const filterByAmenities = (amenityList) => {
    if (!selectedAmenities.length) return true;
    const ids = (amenityList || []).map((t) => t.ma_tien_nghi || t);
    return selectedAmenities.every((id) => ids.includes(id));
  };

  const filteredHotels = useMemo(() => {
    let list = applyPriceFilter(hotels, (h) => h.gia_tu || 0);

    if (selectedStars.length) {
      list = list.filter((h) => selectedStars.includes(h.so_sao || 0));
    }
    if (selectedAmenities.length) {
      list = list.filter((h) => filterByAmenities(h.tien_nghi));
    }

    if (sortBy === 'price_asc') list.sort((a, b) => (a.gia_tu || 0) - (b.gia_tu || 0));
    else if (sortBy === 'price_desc') list.sort((a, b) => (b.gia_tu || 0) - (a.gia_tu || 0));
    else if (sortBy === 'stars_desc') list.sort((a, b) => (b.so_sao || 0) - (a.so_sao || 0));
    else if (sortBy === 'rating_desc') {
      list.sort((a, b) => (b.diem_trung_binh || 0) - (a.diem_trung_binh || 0));
    }

    return list;
  }, [hotels, priceMin, priceMax, selectedStars, selectedAmenities, sortBy]);

  const locationName = locations.find(
    (l) => String(l.ma_dia_diem) === String(filters.ma_dia_diem),
  )?.ten_dia_diem || 'Tất cả địa điểm';

  const nights = useMemo(() => {
    if (!filters.ngay_nhan || !filters.ngay_tra) return 0;
    const a = new Date(filters.ngay_nhan);
    const b = new Date(filters.ngay_tra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [filters.ngay_nhan, filters.ngay_tra]);

  const resultCount = filteredHotels.length;
  const sourceCount = hotels.length;

  const handleBarSearch = (data) => {
    navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${searchFormToParams(data).toString()}`);
  };

  const toggleStar = (star) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star],
    );
  };

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setSortBy('price_asc');
    setSelectedStars([]);
    setSelectedAmenities([]);
    if (priceRange.max > priceRange.min) {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    } else {
      setPriceMin('');
      setPriceMax('');
    }
  };

  const hasActiveFilters = selectedStars.length > 0
    || selectedAmenities.length > 0
    || sortBy !== 'price_asc'
    || (priceRange.max > priceRange.min && (
      Number(priceMin) !== priceRange.min || Number(priceMax) !== priceRange.max
    ));

  const stickyBarRef = useRef(null);
  const [stickyBarHeight, setStickyBarHeight] = useState(170);

  useLayoutEffect(() => {
    const el = stickyBarRef.current;
    if (!el) return undefined;

    const updateHeight = () => {
      setStickyBarHeight(el.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const sidebarProps = {
    priceRange,
    priceMin,
    priceMax,
    onPriceChange: (min, max) => { setPriceMin(min); setPriceMax(max); },
    onPriceReset: () => {
      setPriceMin(String(priceRange.min));
      setPriceMax(String(priceRange.max));
    },
    selectedStars,
    onToggleStar: toggleStar,
    amenityGroups,
    selectedAmenities,
    onToggleAmenity: toggleAmenity,
    onReset: resetFilters,
    hasActiveFilters,
    showSlider: priceRange.max > priceRange.min,
  };

  return (
    <div
      className="search-page-shell"
      style={{ '--sticky-bar-height': `${stickyBarHeight}px` }}
    >
      <div ref={stickyBarRef} className="search-page-sticky-bar">
        <div className="search-page-sticky-inner">
          <HotelSearchBar
            variant="page"
            locations={locations}
            initialValues={searchBarInitial}
            onSearch={handleBarSearch}
          />

          <div className="search-summary search-summary--sticky">
            <div className="search-summary-main">
              <h1 className="search-summary-title">{locationName}</h1>
              <p className="search-summary-meta">
                {resultCount} khách sạn được tìm thấy
                {hasActiveFilters && sourceCount !== resultCount && (
                  <span> (lọc từ {sourceCount})</span>
                )}
                {hasDateSearch && (
                  <>
                    {' · '}
                    {fmtDate(filters.ngay_nhan)} – {fmtDate(filters.ngay_tra)}, {nights} đêm
                  </>
                )}
              </p>
            </div>
            <div className="search-summary-tools">
              <label className="search-summary-sort">
                <span>Xếp theo</span>
                <select
                  className="search-summary-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="search-page-sticky-spacer" aria-hidden="true" />

      <div className="search-page">
      <div className="search-layout">
        <FilterSidebar {...sidebarProps} />

        <div className="search-results-col">
          {loading && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
              Đang tìm khách sạn phù hợp...
            </div>
          )}

          {!loading && error && (
            <div className="content-card" style={{ textAlign: 'center', padding: 48, color: '#e05c5c' }}>
              {error}
            </div>
          )}

          {!loading && !error && sourceCount === 0 && (
            <div className="empty-state content-card">
              <p className="empty-state-text">
                {hasDateSearch
                  ? 'Không tìm thấy khách sạn phù hợp. Hãy thử đổi địa điểm hoặc ngày.'
                  : 'Chưa có khách sạn nào đang hoạt động tại địa điểm này.'}
              </p>
              <Link to={ROUTES.HOME} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                Về trang chủ
              </Link>
            </div>
          )}

          {!loading && !error && sourceCount > 0 && resultCount === 0 && (
            <div className="empty-state content-card">
              <p className="empty-state-text">Không có kết quả phù hợp bộ lọc</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}

          {!loading && !error && filteredHotels.length > 0 && (
            <div className="hotel-result-grid">
              {filteredHotels.map((hotel) => {
                const img = getHotelImage(hotel);
                const amenityNames = (hotel.tien_nghi || []).map((t) => t.ten || t);
                return (
                  <article key={hotel.ma_khach_san} className="hotel-result-card hotel-browse-card">
                    <div className="hotel-result-media">
                      {img ? (
                        <img src={resolveUploadUrl(img.url)} alt={hotel.ten} className="hotel-result-img" />
                      ) : (
                        <div className="hotel-result-img-placeholder" />
                      )}
                    </div>

                    <div className="hotel-result-body">
                      <h2 className="hotel-result-name">{hotel.ten}</h2>
                      <div className="hotel-result-type-row">
                        <span className="hotel-result-type">Khách sạn</span>
                        {hotel.so_sao > 0 && (
                          <span className="hotel-result-stars">{stars(hotel.so_sao)}</span>
                        )}
                      </div>
                      <p className="hotel-result-location">
                        {hotel.dia_diem?.ten_dia_diem ? `${hotel.dia_diem.ten_dia_diem} · ` : ''}
                        {hotel.dia_chi}
                      </p>
                      {amenityNames.length > 0 && (
                        <div className="hotel-result-amenities">
                          {amenityNames.slice(0, 4).map((t) => (
                            <span key={t} className="hotel-result-amenity">{t}</span>
                          ))}
                          {amenityNames.length > 4 && (
                            <span className="hotel-result-amenity">+{amenityNames.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="hotel-result-aside">
                      <HotelRatingBadge score={hotel.diem_trung_binh} count={hotel.so_danh_gia} />
                      <div className="hotel-result-price-block">
                        Giá từ: <span className="hotel-result-price-value">{fmt(hotel.gia_tu)} ₫</span>
                        <span className="hotel-result-price-unit">/ phòng / đêm</span>
                      </div>
                      <Link
                        to={buildHotelDetailUrl(hotel.ma_khach_san, filters)}
                        className="btn btn-primary btn-sm hotel-result-cta"
                      >
                        Chọn phòng
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default HotelSearchPage;
