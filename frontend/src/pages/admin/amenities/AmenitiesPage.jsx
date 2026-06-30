import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAmenities,
  removeAmenity,
  fetchRequests,
  approveRequest,
  rejectRequest,
} from '../../../store/slices/amenitySlice';
import { Plus } from 'lucide-react';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import { HOTEL_CATEGORY_GROUPS, ROOM_CATEGORY_GROUPS } from './constants';
import { groupAmenitiesByCategory } from './utils';
import { AmenityTabs } from './components/AmenityTabs';
import { AmenityListSection } from './components/AmenityListSection';
import { RequestsSection } from './components/RequestsSection';
import { ApproveRequestModal } from './components/ApproveRequestModal';
import { RejectRequestModal } from './components/RejectRequestModal';

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {},
  );

  const [activeTab, setActiveTab] = useState(
    () => location.state?.tab || 'hotel',
  );
  const [keyword, setKeyword] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [requestFilter, setRequestFilter] = useState('cho_xu_ly');

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchRequests());
  }, [dispatch]);

  const pendingCount = requests.filter((r) => r.trang_thai === 'cho_xu_ly').length;
  const approvedCount = requests.filter((r) => r.trang_thai === 'da_tao').length;
  const rejectedCount = requests.filter((r) => r.trang_thai === 'tu_choi').length;

  const hotelAmenities = useMemo(
    () => list.filter((item) => item.loai === 'khach_san' || item.loai === 'ca_hai'),
    [list],
  );
  const roomAmenities = useMemo(
    () => list.filter((item) => item.loai === 'phong' || item.loai === 'ca_hai'),
    [list],
  );

  const hotelGroups = useMemo(() => groupAmenitiesByCategory(hotelAmenities, HOTEL_CATEGORY_GROUPS), [hotelAmenities]);
  const roomGroups = useMemo(() => groupAmenitiesByCategory(roomAmenities, ROOM_CATEGORY_GROUPS), [roomAmenities]);
  const currentGroups = activeTab === 'hotel' ? hotelGroups : roomGroups;

  const filteredGroups = useMemo(() => {
    if (!keyword) return currentGroups;
    return currentGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => item.ten?.toLowerCase().includes(keyword.toLowerCase())),
      }))
      .filter((g) => g.items.length > 0);
  }, [currentGroups, keyword]);

  const filteredRequests = requests.filter((req) => {
    if (requestFilter === 'all') return true;
    return req.trang_thai === requestFilter;
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setKeyword('');
  };

  const handleEdit = (item) => {
    navigate(`/admin/amenities/${item.ma_tien_nghi}/edit`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tiện nghi này?')) return;
    try {
      await dispatch(removeAmenity(id)).unwrap();
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Không thể xóa tiện nghi';
      alert(msg);
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
    if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
    dispatch(rejectRequest({ id: rejectModal, phan_hoi: rejectReason })).then(() => {
      dispatch(fetchRequests());
      setRejectModal(null);
      setRejectReason('');
    });
  };

  return (
    <div>
      <ManagementHeader
        title="Quản Lý Tiện Nghi"
        subtitle="Quản lý danh mục tiện nghi khách sạn và loại phòng."
        actionLabel={activeTab !== 'requests' ? 'Thêm tiện nghi' : undefined}
        onAction={activeTab !== 'requests' ? openAddPage : undefined}
        actionIcon={Plus}
      />

      <AmenityTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCount}
      />

      {(activeTab === 'hotel' || activeTab === 'room') && (
        <AmenityListSection
          keyword={keyword}
          onKeywordChange={setKeyword}
          loading={loading}
          filteredGroups={filteredGroups}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsSection
          requestFilter={requestFilter}
          onFilterChange={setRequestFilter}
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          totalCount={requests.length}
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
    </div>
  );
};

export default AmenitiesPage;
