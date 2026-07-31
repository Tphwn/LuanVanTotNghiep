import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAmenities,
  fetchAmenityProposals,
  lockAmenity,
  unlockAmenity,
} from '../../../store/slices/amenitySlice';
import { Plus, Bell, Building2, BedDouble } from 'lucide-react';
import { HOTEL_CATEGORY_GROUPS, ROOM_CATEGORY_GROUPS } from './constants';
import { groupAmenitiesByCategory } from './utils';
import { AmenityListSection } from './components/AmenityListSection';
import { RequestsSection } from './components/RequestsSection';
import AmenityLockConfirmModal from './components/AmenityLockConfirmModal';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import api from '../../../services/api';

const TYPE_TABS = [
  { id: 'hotel', label: 'Tiện nghi khách sạn', Icon: Building2 },
  { id: 'room', label: 'Tiện nghi loại phòng', Icon: BedDouble },
];

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { list = [], proposals = [], loading = false } = useSelector(
    (state) => state.amenities || {},
  );

  const initialTypeTab = location.state?.tab === 'room' ? 'room' : 'hotel';
  const [viewMode, setViewMode] = useState(
    () => (location.state?.tab === 'requests' ? 'requests' : 'main'),
  );
  const [typeTab, setTypeTab] = useState(initialTypeTab);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lockTarget, setLockTarget] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    dispatch(fetchAmenities());
    dispatch(fetchAmenityProposals());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.tab === 'requests') setViewMode('requests');
    if (location.state?.tab === 'room' || location.state?.tab === 'hotel') {
      setTypeTab(location.state.tab);
      setViewMode('main');
    }
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: { tab: location.state?.tab } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadProposalCount = proposals.filter((p) => !p.da_doc).length;

  const categoryGroups = typeTab === 'room' ? ROOM_CATEGORY_GROUPS : HOTEL_CATEGORY_GROUPS;

  const scopedAmenities = useMemo(() => {
    if (typeTab === 'room') {
      return list.filter((item) => item.loai === 'phong' || item.loai === 'ca_hai');
    }
    return list.filter((item) => item.loai === 'khach_san' || item.loai === 'ca_hai');
  }, [list, typeTab]);

  const grouped = useMemo(
    () => groupAmenitiesByCategory(scopedAmenities, categoryGroups),
    [scopedAmenities, categoryGroups],
  );

  const availableGroups = useMemo(
    () => grouped.filter((group) => group.items.length > 0),
    [grouped],
  );

  useEffect(() => {
    setCategoryFilter('all');
  }, [typeTab]);

  useEffect(() => {
    if (categoryFilter === 'all') return;
    if (!availableGroups.some((g) => g.id === categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [availableGroups, categoryFilter]);

  const filteredAmenities = useMemo(() => {
    if (categoryFilter === 'all') {
      return availableGroups.flatMap((g) => g.items.map((item) => ({
        ...item,
        danh_muc: item.danh_muc || g.id,
      })));
    }
    const group = availableGroups.find((g) => g.id === categoryFilter);
    return (group?.items || []).map((item) => ({
      ...item,
      danh_muc: item.danh_muc || group.id,
    }));
  }, [availableGroups, categoryFilter]);

  const handleEdit = (item) => {
    navigate(`/admin/amenities/${item.ma_tien_nghi}/edit`);
  };

  const handleToggleLock = (item) => {
    setLockTarget(item);
  };

  const handleConfirmLock = async (payload) => {
    if (!lockTarget) return;
    const isLocked = lockTarget.trang_thai === 'an';
    setLockLoading(true);
    try {
      if (isLocked) {
        await dispatch(unlockAmenity({
          id: lockTarget.ma_tien_nghi,
          ...payload,
        })).unwrap();
        showToast('Mở khóa tiện nghi thành công');
      } else {
        await dispatch(lockAmenity({
          id: lockTarget.ma_tien_nghi,
          ...payload,
        })).unwrap();
        showToast('Khóa tiện nghi thành công');
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
    const proposalId = proposal.ma_thong_bao;
    if (proposalId) {
      sessionStorage.setItem('amenityFromProposalId', String(proposalId));
    }
    navigate('/admin/amenities/create', {
      state: {
        suggestedName: match?.[1]?.trim() || '',
        fromProposalId: proposalId,
      },
    });
  };

  const handleTypeTabChange = (tabId) => {
    setTypeTab(tabId);
    setCategoryFilter('all');
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
        <>
          <div className="amenity-type-tabs partner-account-tabs" role="tablist">
            {TYPE_TABS.map((tab) => {
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={typeTab === tab.id}
                  className={`partner-account-tab amenity-type-tab${typeTab === tab.id ? ' is-active' : ''}`}
                  onClick={() => handleTypeTabChange(tab.id)}
                >
                  <TabIcon size={15} strokeWidth={1.8} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AmenityListSection
            loading={loading}
            availableGroups={availableGroups}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            amenities={filteredAmenities}
            listKey={typeTab}
            onEdit={handleEdit}
            onToggleLock={handleToggleLock}
          />
        </>
      ) : (
        <RequestsSection
          proposals={proposals}
          amenities={list}
          loading={false}
          onMarkRead={handleMarkProposalRead}
          onAddAmenity={handleAddFromProposal}
        />
      )}

      <AmenityLockConfirmModal
        amenity={lockTarget}
        loading={lockLoading}
        onClose={() => !lockLoading && setLockTarget(null)}
        onConfirm={handleConfirmLock}
      />
    </div>
  );
};

export default AmenitiesPage;
