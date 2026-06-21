import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';
import {
  fetchMyHotels, fetchDiaDiem, fetchAmenitiesForHotel,
  updateHotel, clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import StarRating from '../../../components/common/management/StarRating';
import HotelThumb from '../../../components/common/management/HotelThumb';
import { TRANG_THAI, TAB_FILTER, getLoaiHinh } from './constants';

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const partnerHotelState = useSelector((state) => state.partnerHotel);
  const { list = [], diaDiem = [], loading, error, successMsg } = partnerHotelState || {};

  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [diaDiemFilter, setDiaDiemFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchMyHotels());
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, dispatch]);

  const stats = useMemo(() => ({
    total: list.length,
    daDuyet: list.filter((h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai)).length,
    choDuyet: list.filter((h) => h.trang_thai === 'cho_duyet').length,
    dangBan: list.filter((h) => h.trang_thai === 'hoat_dong').length,
  }), [list]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'da_duyet', label: 'Đã duyệt', count: stats.daDuyet },
    { id: 'cho_duyet', label: 'Chờ duyệt', count: stats.choDuyet },
    { id: 'tu_choi', label: 'Từ chối', count: list.filter((h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai)).length },
  ], [list, stats]);

  const filteredList = useMemo(() => {
    const tabFilter = TAB_FILTER[activeTab] || TAB_FILTER.all;
    const text = keyword.trim().toLowerCase();
    return (list || []).filter((hotel) => {
      if (!tabFilter(hotel)) return false;
      const matchDiaDiem = diaDiemFilter === 'all' || String(hotel.ma_dia_diem) === diaDiemFilter;
      const matchKeyword = !text
        || hotel.ten?.toLowerCase().includes(text)
        || hotel.dia_chi?.toLowerCase().includes(text)
        || hotel.dia_diem?.ten_dia_diem?.toLowerCase().includes(text);
      return matchDiaDiem && matchKeyword;
    });
  }, [list, keyword, activeTab, diaDiemFilter]);

  const handleToggleStatus = (hotel) => {
    const isActivating = hotel.trang_thai === 'bi_khoa';
    const confirmMsg = isActivating
      ? `Bạn muốn MỞ LẠI hoạt động cho khách sạn "${hotel.ten}"?`
      : `Bạn có chắc chắn muốn TẠM NGƯNG khách sạn "${hotel.ten}"? Khách hàng sẽ không thể đặt phòng mới.`;

    if (window.confirm(confirmMsg)) {
      const newStatus = isActivating ? 'hoat_dong' : 'bi_khoa';
      dispatch(updateHotel({ id: hotel.ma_khach_san, data: { trang_thai: newStatus } }));
    }
  };

  const canToggle = (status) => status === 'hoat_dong' || status === 'bi_khoa';

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle="Danh sách cơ sở khách sạn của bạn"
        actionLabel="Thêm Khách sạn"
        onAction={() => navigate('/partner/hotels/create')}
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên hoặc địa chỉ..."
        />
        <select
          className="mgmt-select-inline"
          value={diaDiemFilter}
          onChange={(e) => setDiaDiemFilter(e.target.value)}
        >
          <option value="all">Tất cả địa điểm</option>
          {diaDiem.map((d) => (
            <option key={d.ma_dia_diem} value={String(d.ma_dia_diem)}>{d.ten_dia_diem}</option>
          ))}
        </select>
      </div>

      <FilterTabs tabs={filterTabs} active={activeTab} onChange={setActiveTab} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {list.length ? 'Không có khách sạn phù hợp bộ lọc' : 'Chưa có khách sạn nào. Hãy thêm cơ sở đầu tiên!'}
            </p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <colgroup>
                <col className="mgmt-col-img" />
                <col />
                <col />
                <col className="mgmt-col-type" />
                <col className="mgmt-col-star" />
                <col className="mgmt-col-status" />
                <col className="mgmt-col-toggle" />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên khách sạn</th>
                  <th>Địa chỉ</th>
                  <th>Loại hình</th>
                  <th>Sao</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((hotel) => {
                  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
                  const isActive = hotel.trang_thai === 'hoat_dong';
                  return (
                    <tr key={hotel.ma_khach_san} style={{ opacity: hotel.trang_thai === 'bi_khoa' ? 0.75 : 1 }}>
                      <td><HotelThumb hotel={hotel} /></td>
                      <td>
                        <div
                          className="mgmt-cell-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/partner/hotels/${hotel.ma_khach_san}`)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/partner/hotels/${hotel.ma_khach_san}`)}
                          role="button"
                          tabIndex={0}
                        >
                          {hotel.ten}
                        </div>
                      </td>
                      <td>
                        <div className="mgmt-cell-address" title={hotel.dia_chi}>
                          {hotel.dia_chi || '—'}
                        </div>
                      </td>
                      <td><span className="mgmt-type-tag">{getLoaiHinh(hotel)}</span></td>
                      <td><StarRating value={hotel.so_sao} /></td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <ToggleSwitch
                          compact
                          checked={isActive}
                          onChange={() => handleToggleStatus(hotel)}
                          disabled={!canToggle(hotel.trang_thai)}
                          labelOn="Đang hoạt động"
                          labelOff="Tạm ngừng"
                        />
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => navigate(`/partner/hotels/${hotel.ma_khach_san}`)}
                        />
                        <ActionButton
                          variant="edit"
                          iconOnly
                          icon={Pencil}
                          title="Sửa"
                          onClick={() => navigate(`/partner/hotels/${hotel.ma_khach_san}/edit`)}
                        />
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsPage;
