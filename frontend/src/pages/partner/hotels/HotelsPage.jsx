import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  fetchMyHotels, fetchDiaDiem, fetchAmenitiesForHotel,
  updateHotel, deleteHotel, clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import FilterActions from '../../../components/common/management/FilterActions';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import StarRating from '../../../components/common/management/StarRating';
import HotelThumb from '../../../components/common/management/HotelThumb';
import PartnerHotelPauseConfirmModal from './components/PartnerHotelPauseConfirmModal';
import { TAB_FILTER } from './constants';
import { getHotelStatusMeta } from '../../../constants/statusConfig';

const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerHotelState = useSelector((state) => state.partnerHotel);
  const { list = [], diaDiem = [], loading, error, successMsg } = partnerHotelState || {};

  const [flashMsg, setFlashMsg] = useState(location.state?.toast || '');
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [diaDiemFilter, setDiaDiemFilter] = useState('all');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftDiaDiemFilter, setDraftDiaDiemFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyHotels());
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
  }, [dispatch]);

  useEffect(() => {
    if (!flashMsg) return undefined;
    navigate(location.pathname, { replace: true, state: {} });
    const timer = setTimeout(() => setFlashMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [flashMsg, location.pathname, navigate]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMsg, error, dispatch]);

  const stats = useMemo(() => ({
    total: list.length,
    daDuyet: list.filter((h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai)).length,
    choDuyet: list.filter((h) => h.trang_thai === 'cho_duyet').length,
    tuChoi: list.filter((h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai)).length,
  }), [list]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats.total, tone: 'neutral' },
    { id: 'da_duyet', label: 'Đã duyệt', count: stats.daDuyet, tone: 'success' },
    { id: 'cho_duyet', label: 'Chờ duyệt', count: stats.choDuyet, tone: 'warning' },
    { id: 'tu_choi', label: 'Từ chối', count: stats.tuChoi, tone: 'danger' },
  ], [stats]);

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

  const {
    pagedItems: pagedList,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(filteredList, 10, [keyword, activeTab, diaDiemFilter]);

  const handleToggleStatus = (hotel) => {
    const isActivating = hotel.trang_thai === 'bi_khoa';
    setConfirmAction({
      hotel,
      action: isActivating ? 'resume' : 'pause',
    });
  };

  const handleCloseConfirm = () => {
    if (toggleLoadingId) return;
    setConfirmAction(null);
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;

    const { hotel, action } = confirmAction;
    const newStatus = action === 'resume' ? 'hoat_dong' : 'bi_khoa';

    setToggleLoadingId(hotel.ma_khach_san);
    const result = await dispatch(updateHotel({
      id: hotel.ma_khach_san,
      data: { trang_thai: newStatus },
    }));
    setToggleLoadingId(null);

    if (!updateHotel.rejected.match(result)) {
      setConfirmAction(null);
    }
  };

  const canToggle = (status) => status === 'hoat_dong' || status === 'bi_khoa';
  const canDelete = (status) => status === 'cho_duyet';

  const applyFilters = () => {
    setKeyword(draftKeyword);
    setDiaDiemFilter(draftDiaDiemFilter);
  };

  const clearFilters = () => {
    setKeyword('');
    setActiveTab('all');
    setDiaDiemFilter('all');
    setDraftKeyword('');
    setDraftDiaDiemFilter('all');
  };

  const handleDelete = (hotel) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa khách sạn "${hotel.ten}"?`;
    if (window.confirm(confirmMsg)) {
      dispatch(deleteHotel(hotel.ma_khach_san));
    }
  };

  const toastMessage = flashMsg || successMsg || error;
  const toastType = flashMsg || successMsg ? 'success' : 'error';

  return (
    <div className="mgmt-page mgmt-list-page partner-hotels-page">
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle="Danh sách cơ sở khách sạn của bạn"
        actionLabel="Thêm Khách sạn"
        onAction={() => navigate('/partner/hotels/create')}
      />

      {toastMessage && (
        <div className={`mgmt-toast ${toastType}`}>{toastMessage}</div>
      )}

      <PartnerHotelPauseConfirmModal
        hotel={confirmAction?.hotel}
        action={confirmAction?.action}
        loading={Boolean(confirmAction && toggleLoadingId === confirmAction.hotel?.ma_khach_san)}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmToggle}
      />

      <ManagementToolbar
        searchValue={draftKeyword}
        onSearchChange={(e) => setDraftKeyword(e.target.value)}
        searchPlaceholder="Tìm theo tên hoặc địa chỉ..."
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <select
          className="mgmt-select-inline partner-hotels-location-filter"
          value={draftDiaDiemFilter}
          onChange={(e) => setDraftDiaDiemFilter(e.target.value)}
          aria-label="Lọc theo địa điểm"
        >
          <option value="all">Tất cả địa điểm</option>
          {diaDiem.map((d) => (
            <option key={d.ma_dia_diem} value={String(d.ma_dia_diem)}>{d.ten_dia_diem}</option>
          ))}
        </select>
        <FilterActions onApply={applyFilters} onClear={clearFilters} />
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {list.length ? 'Không có khách sạn phù hợp bộ lọc' : 'Chưa có khách sạn nào. Hãy thêm cơ sở đầu tiên!'}
            </p>
          </div>
        ) : (
          <>
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Ảnh</th>
                  <th>Tên khách sạn</th>
                  <th>Địa chỉ</th>
                  <th style={{ width: 90 }}>Sao</th>
                  <th style={{ width: 150 }}>Trạng thái</th>
                  <th style={{ width: 130 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedList.map((hotel) => {
                  const st = getHotelStatusMeta(hotel, { variant: 'text' });
                  const isActive = hotel.trang_thai === 'hoat_dong';
                  const adminLocked = hotel.trang_thai === 'bi_khoa' && !hotel.khoa_do_doi_tac;
                  const isToggling = toggleLoadingId === hotel.ma_khach_san;
                  return (
                    <tr key={hotel.ma_khach_san} style={{ opacity: hotel.trang_thai === 'bi_khoa' ? 0.85 : 1 }}>
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
                      <td><StarRating value={hotel.so_sao} /></td>
                      <td>
                        {canToggle(hotel.trang_thai) ? (
                          <ToggleSwitch
                            compact
                            checked={isActive}
                            disabled={adminLocked || isToggling}
                            onChange={() => handleToggleStatus(hotel)}
                            labelOn="Đang hoạt động"
                            labelOff={adminLocked ? 'Admin khóa' : 'Tạm ngừng'}
                          />
                        ) : (
                          <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
                        )}
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
                        {canDelete(hotel.trang_thai) && (
                          <ActionButton
                            variant="delete"
                            iconOnly
                            icon={Trash2}
                            title="Xóa"
                            onClick={() => handleDelete(hotel)}
                          />
                        )}
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showPagination && (
            <ListPagination
              total={filteredList.length}
              currentPage={currentPage}
              totalPages={totalPages}
              rangeFrom={rangeFrom}
              rangeTo={rangeTo}
              pageNumbers={pageNumbers}
              onPageChange={setPage}
            />
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default HotelsPage;
