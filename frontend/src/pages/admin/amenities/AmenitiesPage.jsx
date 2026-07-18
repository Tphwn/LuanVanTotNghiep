import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAmenities,
  fetchAmenityProposals,
  lockAmenity,
  unlockAmenity,
} from '../../../store/slices/amenitySlice';
import { Plus, Bell, Building2, BedDouble, Lock, Unlock } from 'lucide-react';
import { HOTEL_CATEGORY_GROUPS, ROOM_CATEGORY_GROUPS } from './constants';
import { groupAmenitiesByCategory } from './utils';
import { AmenityListSection } from './components/AmenityListSection';
import { RequestsSection } from './components/RequestsSection';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import api from '../../../services/api';

const pickDefaultCategory = (availableGroups, prev) => {
  if (availableGroups.length === 0) return '';
  return availableGroups.some((g) => g.id === prev) ? prev : availableGroups[0].id;
};

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { list = [], proposals = [], loading = false } = useSelector(
    (state) => state.amenities || {},
  );

  const [viewMode, setViewMode] = useState(
    () => (location.state?.tab === 'requests' ? 'requests' : 'main'),
  );
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState('');
  const [roomCategoryFilter, setRoomCategoryFilter] = useState('');
  const [lockTarget, setLockTarget] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchAmenityProposals());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.tab === 'requests') setViewMode('requests');
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: { tab: location.state?.tab } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadProposalCount = proposals.filter((p) => !p.da_doc).length;

  const hotelAmenities = useMemo(
    () => list.filter((item) => item.loai === 'khach_san' || item.loai === 'ca_hai'),
    [list],
  );
  const roomAmenities = useMemo(
    () => list.filter((item) => item.loai === 'phong' || item.loai === 'ca_hai'),
    [list],
  );

  const hotelGroups = useMemo(
    () => groupAmenitiesByCategory(hotelAmenities, HOTEL_CATEGORY_GROUPS),
    [hotelAmenities],
  );
  const roomGroups = useMemo(
    () => groupAmenitiesByCategory(roomAmenities, ROOM_CATEGORY_GROUPS),
    [roomAmenities],
  );

  const hotelAvailableGroups = useMemo(
    () => hotelGroups.filter((group) => group.items.length > 0),
    [hotelGroups],
  );
  const roomAvailableGroups = useMemo(
    () => roomGroups.filter((group) => group.items.length > 0),
    [roomGroups],
  );

  useEffect(() => {
    setHotelCategoryFilter((prev) => pickDefaultCategory(hotelAvailableGroups, prev));
  }, [hotelAvailableGroups]);

  useEffect(() => {
    setRoomCategoryFilter((prev) => pickDefaultCategory(roomAvailableGroups, prev));
  }, [roomAvailableGroups]);

  const hotelFilteredAmenities = useMemo(() => {
    if (!hotelCategoryFilter) return [];
    return hotelGroups.find((g) => g.id === hotelCategoryFilter)?.items || [];
  }, [hotelCategoryFilter, hotelGroups]);

  const roomFilteredAmenities = useMemo(() => {
    if (!roomCategoryFilter) return [];
    return roomGroups.find((g) => g.id === roomCategoryFilter)?.items || [];
  }, [roomCategoryFilter, roomGroups]);

  const handleEdit = (item) => {
    navigate(`/admin/amenities/${item.ma_tien_nghi}/edit`);
  };

  const handleToggleLock = (item) => {
    const isLocked = item.trang_thai === 'an';
    if (!isLocked && item.dang_su_dung) {
      showToast(
        'Không thể khóa tiện nghi này vì đã có đối tác chọn. Chỉ khóa khi chưa có đối tác nào sử dụng.',
        'error',
      );
      return;
    }
    setLockTarget(item);
  };

  const handleConfirmLock = async () => {
    if (!lockTarget) return;
    const isLocked = lockTarget.trang_thai === 'an';
    setLockLoading(true);
    try {
      if (isLocked) {
        await dispatch(unlockAmenity(lockTarget.ma_tien_nghi)).unwrap();
        showToast('Đã mở khóa tiện nghi thành công');
      } else {
        await dispatch(lockAmenity(lockTarget.ma_tien_nghi)).unwrap();
        showToast('Đã khóa tiện nghi thành công');
      }
      setLockTarget(null);
    } catch (err) {
      const msg =
        (typeof err === 'string' ? err : null)
        || err?.message
        || err?.response?.data?.message
        || 'Thao tác thất bại';
      showToast(msg, 'error');
    } finally {
      setLockLoading(false);
    }
  };

  const handleMarkProposalRead = async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      await dispatch(fetchAmenityProposals());
    } catch {
      showToast('Không thể đánh dấu đã xem', 'error');
    }
  };

  const handleAddFromProposal = (proposal) => {
    const match = String(proposal.tieu_de || '').match(/Đề xuất tiện nghi mới:\s*(.+)$/i);
    navigate('/admin/amenities/create', {
      state: { suggestedName: match?.[1]?.trim() || '' },
    });
  };

  return (
    <div className="mgmt-page mgmt-list-page amenity-page">
      <div className="mgmt-header amenity-page-header">
        <div className="mgmt-header-row">
          <div className="mgmt-header-main">
            <h1 className="mgmt-title">Quản Lý Tiện Nghi</h1>
          </div>
          <div className="amenity-header-actions">
            <button
              type="button"
              className={`amenity-requests-link${viewMode === 'requests' ? ' active' : ''}`}
              onClick={() => setViewMode('requests')}
            >
              <Bell size={16} strokeWidth={1.8} />
              Đề xuất từ đối tác
              {unreadProposalCount > 0 && (
                <span className="amenity-header-badge">{unreadProposalCount}</span>
              )}
            </button>
            {viewMode === 'main' ? (
              <button
                type="button"
                className="btn btn-primary mgmt-header-action"
                onClick={() => navigate('/admin/amenities/create')}
              >
                <Plus size={18} strokeWidth={2.5} />
                Thêm tiện nghi
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost amenity-back-btn"
                onClick={() => setViewMode('main')}
              >
                Quay lại danh sách
              </button>
            )}
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      {viewMode === 'main' ? (
        <div className="amenity-dual-grid">
          <AmenityListSection
            loading={loading}
            panelTitle="Tiện nghi khách sạn"
            panelIcon={Building2}
            availableGroups={hotelAvailableGroups}
            categoryFilter={hotelCategoryFilter}
            onCategoryChange={setHotelCategoryFilter}
            amenities={hotelFilteredAmenities}
            onEdit={handleEdit}
            onToggleLock={handleToggleLock}
          />
          <AmenityListSection
            loading={loading}
            panelTitle="Tiện nghi loại phòng"
            panelIcon={BedDouble}
            availableGroups={roomAvailableGroups}
            categoryFilter={roomCategoryFilter}
            onCategoryChange={setRoomCategoryFilter}
            amenities={roomFilteredAmenities}
            onEdit={handleEdit}
            onToggleLock={handleToggleLock}
          />
        </div>
      ) : (
        <RequestsSection
          proposals={proposals}
          loading={false}
          onMarkRead={handleMarkProposalRead}
          onAddAmenity={handleAddFromProposal}
        />
      )}

      <ConfirmModal
        open={!!lockTarget}
        variant={lockTarget?.trang_thai === 'an' ? 'primary' : 'danger'}
        icon={lockTarget?.trang_thai === 'an' ? <Unlock size={20} /> : <Lock size={20} />}
        title={lockTarget?.trang_thai === 'an' ? 'Xác nhận mở khóa tiện nghi' : 'Xác nhận khóa tiện nghi'}
        intro={lockTarget?.trang_thai === 'an'
          ? 'Bạn có chắc muốn mở khóa tiện nghi này? Tiện nghi sẽ hoạt động trở lại và có thể được gán cho khách sạn/loại phòng.'
          : 'Bạn có chắc muốn khóa tiện nghi này? Chỉ khóa được khi chưa có đối tác nào chọn. Sau khi khóa, tiện nghi sẽ bị ẩn và không thể gán mới.'}
        infoRows={lockTarget ? [
          { label: 'Tên tiện nghi', value: lockTarget.ten },
        ] : []}
        confirmText={lockTarget?.trang_thai === 'an' ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
        loading={lockLoading}
        onClose={() => !lockLoading && setLockTarget(null)}
        onConfirm={handleConfirmLock}
      />
    </div>
  );
};

export default AmenitiesPage;
