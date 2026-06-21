import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAmenities,
  removeAmenity,
  fetchRequests,
  approveRequest,
  rejectRequest,
} from '../../../store/slices/amenitySlice';
import { suggestIconSlugFromName, resolveIconSlug } from '../../../utils/amenityIcons';
import { Plus } from 'lucide-react';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import { HOTEL_CATEGORY_GROUPS, ROOM_CATEGORY_GROUPS } from './constants';
import { inferLoaiDeXuat, groupAmenitiesByCategory } from './utils';
import { AmenityTabs } from './components/AmenityTabs';
import { AmenityListSection } from './components/AmenityListSection';
import { RequestsSection } from './components/RequestsSection';
import { ApproveRequestModal } from './components/ApproveRequestModal';
import { RejectRequestModal } from './components/RejectRequestModal';

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list = [], requests = [], loading = false } = useSelector(
    (state) => state.amenities || {},
  );

  const [activeTab, setActiveTab] = useState('hotel');
  const [keyword, setKeyword] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [approveForm, setApproveForm] = useState({ loai: 'ca_hai', bieu_tuong: 'wifi' });
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

  const currentLoai = activeTab === 'hotel' ? 'khach_san' : activeTab === 'room' ? 'phong' : null;

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

  const handleDelete = (id) => {
    if (window.confirm('Xóa tiện nghi này?')) dispatch(removeAmenity(id));
  };

  const openAddPage = () => {
    navigate('/admin/amenities/create', { state: { loai: currentLoai || 'khach_san' } });
  };

  const openApprove = (req) => {
    const loai = inferLoaiDeXuat(req) || 'ca_hai';
    const icon = suggestIconSlugFromName(req.ten_de_xuat);
    setApproveModal(req);
    setApproveForm({ loai, bieu_tuong: icon });
  };

  const handleApproveSubmit = () => {
    if (!approveModal) return;
    const bieu_tuong = resolveIconSlug(approveForm.bieu_tuong, approveModal.ten_de_xuat);
    dispatch(approveRequest({
      id: approveModal.ma_yeu_cau,
      loai: approveForm.loai,
      bieu_tuong,
    })).then(() => {
      dispatch(fetchAmenities());
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
        title="Quản lý Tiện nghi"
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
          onAdd={openAddPage}
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
        approveForm={approveForm}
        onClose={() => setApproveModal(null)}
        onSubmit={handleApproveSubmit}
        onLoaiChange={(value) => setApproveForm({ ...approveForm, loai: value })}
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
