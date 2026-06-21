import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchMyHotels,
  fetchDiaDiem,
  fetchAmenitiesForHotel,
  createHotel,
  updateHotel,
} from '../../../store/slices/partnerHotelSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import HotelFormContent from './HotelFormModal';

export default function HotelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = Boolean(id);
  const {
    list = [],
    diaDiem = [],
    amenities = [],
    defaultCancelPolicies = [],
    loading,
  } = useSelector((s) => s.partnerHotel || {});

  const hotel = isEdit ? list.find((h) => String(h.ma_khach_san) === String(id)) : null;

  useEffect(() => {
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
    if (list.length === 0) dispatch(fetchMyHotels());
  }, [dispatch, list.length]);

  const handleSubmit = async (formData) => {
    if (!isEdit) {
      const res = await dispatch(createHotel(formData));
      if (!res.error) navigate('/partner/hotels');
    } else {
      const res = await dispatch(updateHotel({ id: hotel.ma_khach_san, data: formData }));
      if (!res.error) navigate(`/partner/hotels/${id}`);
    }
  };

  if (isEdit && !hotel && (loading || list.length === 0)) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (isEdit && !hotel && list.length > 0) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy khách sạn</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/partner/hotels')}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle={isEdit ? `Chỉnh sửa: ${hotel?.ten}` : 'Thêm khách sạn mới'}
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() => navigate('/partner/hotels')}
      >
        ← Quay lại 
      </button>

      <div className="content-card">
        <HotelFormContent
          key={hotel?.ma_khach_san || 'new'}
          hotel={hotel}
          diaDiem={diaDiem}
          amenities={amenities}
          defaultCancelPolicies={defaultCancelPolicies}
          onClose={() => navigate('/partner/hotels')}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
