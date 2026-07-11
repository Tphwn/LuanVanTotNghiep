import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAmenities,
  fetchRequests,
  approveRequest,
  rejectRequest,
  lockAmenity,
  unlockAmenity,
} from '../../../store/slices/amenitySlice';
import { Plus, Bell, Building2, BedDouble, Lock, Unlock } from 'lucide-react';
import { HOTEL_CATEGORY_GROUPS, ROOM_CATEGORY_GROUPS } from './constants';
import { groupAmenitiesByCategory, inferLoaiDeXuat } from './utils';
import { AmenityListSection } from './components/AmenityListSection';
import { RequestsSection } from './components/RequestsSection';
import { ApproveRequestModal } from './components/ApproveRequestModal';
import { RejectRequestModal } from './components/RejectRequestModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';

const pickDefaultCategory = (availableGroups, prev) => {
  if (availableGroups.length === 0) return '';
  return availableGroups.some((g) => g.id === prev) ? prev : availableGroups[0].id;
};

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {},
  );

  const [viewMode, setViewMode] = useState(
    () => (location.state?.tab === 'requests' ? 'requests' : 'main'),
  );
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [requestFilter, setRequestFilter] = useState('cho_xu_ly');
  const [requestLoaiFilter, setRequestLoaiFilter] = useState('khach_san');
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState('');
  const [roomCategoryFilter, setRoomCategoryFilter] = useState('');
  const [lockTarget, setLockTarget] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchRequests());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = requests.filter((r) => r.trang_thai === 'cho_xu_ly').length;

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

  const scopedRequests = useMemo(
    () => requests.filter((req) => {
      const loai = inferLoaiDeXuat(req);
      if (requestLoaiFilter === 'khach_san') return loai === 'khach_san';
      if (requestLoaiFilter === 'phong') return loai === 'phong';
      return true;
    }),
    [requests, requestLoaiFilter],
  );

  const approvedCount = scopedRequests.filter((r) => r.trang_thai === 'da_tao').length;
  const rejectedCount = scopedRequests.filter((r) => r.trang_thai === 'tu_choi').length;
  const scopedPendingCount = scopedRequests.filter((r) => r.trang_thai === 'cho_xu_ly').length;

  const filteredRequests = scopedRequests.filter((req) => {
    if (requestFilter === 'all') return true;
    return req.trang_thai === requestFilter;
  });

  const handleRequestLoaiChange = (loai) => {
    setRequestLoaiFilter(loai);
    setRequestFilter('cho_xu_ly');
  };

  const openRequestsView = () => {
    setViewMode('requests');
    setRequestFilter('cho_xu_ly');
  };

  const handleEdit = (item) => {
    navigate(`/admin/amenities/${item.ma_tien_nghi}/edit`);
  };

  const handleToggleLock = (item) => {
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
      const msg = err?.message || err?.response?.data?.message || 'Thao tác thất bại';
      showToast(msg, 'error');
    } finally {
      setLockLoading(false);
    }
  };

  const openAddPage = () => {
    navigate('/admin/amenities/create');
  };

  const openApprove = (req) => {
    setApproveModal(req);
  };

  const handleApproveSubmit = () => {
    if (!approveModal) return;
    dispatch(approveRequest({ id: approveModal.ma_yeu_cau })).then(() => {
      dispatch(fetchRequests());
      setApproveModal(null);
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return showToast('Vui lòng nhập lý do từ chối', 'error');
    dispatch(rejectRequest({ id: rejectModal, phan_hoi: rejectReason })).then(() => {
      dispatch(fetchRequests());
      setRejectModal(null);
      setRejectReason('');
    });
  };

  return (
    <div className="mgmt-page mgmt-list-page amenity-page">
      <div className="mgmt-header amenity-page-header">
        <div className="mgmt-header-main">
          <h1 className="mgmt-title">Quản Lý Tiện Nghi</h1>
        </div>
        <div className="amenity-header-actions">
          <button
            type="button"
            className={`amenity-requests-link${viewMode === 'requests' ? ' active' : ''}`}
            onClick={openRequestsView}
          >
            <Bell size={16} strokeWidth={1.8} />
            Yêu cầu từ đối tác
            {pendingCount > 0 && (
              <span className="amenity-header-badge">{pendingCount}</span>
            )}
          </button>
          {viewMode === 'main' ? (
            <button type="button" className="btn btn-primary mgmt-header-action" onClick={openAddPage}>
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
          requestLoaiFilter={requestLoaiFilter}
          onLoaiFilterChange={handleRequestLoaiChange}
          requestFilter={requestFilter}
          onFilterChange={setRequestFilter}
          pendingCount={scopedPendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          totalCount={scopedRequests.length}
          filteredRequests={filteredRequests}
          onApprove={openApprove}
          onReject={(id) => setRejectModal(id)}
        />
      )}

      <ApproveRequestModal
        request={approveModal}
        onClose={() => setApproveModal(null)}
        onSubmit={handleApproveSubmit}
      />

      <RejectRequestModal
        isOpen={!!rejectModal}
        rejectReason={rejectReason}
        onClose={() => setRejectModal(null)}
        onSubmit={handleRejectSubmit}
        onReasonChange={setRejectReason}
      />

      <ConfirmModal
        open={!!lockTarget}
        variant={lockTarget?.trang_thai === 'an' ? 'primary' : 'danger'}
        icon={lockTarget?.trang_thai === 'an' ? <Unlock size={20} /> : <Lock size={20} />}
        title={lockTarget?.trang_thai === 'an' ? 'Xác nhận mở khóa tiện nghi' : 'Xác nhận khóa tiện nghi'}
        intro={lockTarget?.trang_thai === 'an'
          ? 'Bạn có chắc muốn mở khóa tiện nghi này? Tiện nghi sẽ hoạt động trở lại và có thể được gán cho khách sạn/loại phòng.'
          : 'Bạn có chắc muốn khóa tiện nghi này? Tiện nghi sẽ bị ẩn và không thể gán mới cho khách sạn/loại phòng.'}
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
