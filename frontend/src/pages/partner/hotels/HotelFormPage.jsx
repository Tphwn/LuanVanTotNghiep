import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchMyHotels,
  fetchDiaDiem,
  fetchAmenitiesForHotel,
  createHotel,
  updateHotel,
  clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';
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
    successMsg,
  } = useSelector((s) => s.partnerHotel || {});

  const [localSuccess, setLocalSuccess] = useState('');
  const [formVersion, setFormVersion] = useState(0);

  const hotel = isEdit ? list.find((h) => String(h.ma_khach_san) === String(id)) : null;

  useEffect(() => {
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
    if (list.length === 0) dispatch(fetchMyHotels());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (successMsg) {
      setLocalSuccess(successMsg);
      dispatch(clearMsg());
    }
  }, [successMsg, dispatch]);

  useEffect(() => {
    if (!localSuccess) return undefined;
    const timer = setTimeout(() => setLocalSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [localSuccess]);

  const handleSubmit = async (formData) => {
    if (!isEdit) {
      const res = await dispatch(createHotel(formData));
      if (res.error) {
        throw new Error(res.payload || 'Không thể tạo khách sạn');
      }
      dispatch(clearMsg());
      navigate('/partner/hotels', {
        state: { toast: 'Thêm khách sạn thành công! Chờ admin duyệt.' },
      });
      return;
    }

    const res = await dispatch(updateHotel({ id: hotel.ma_khach_san, data: formData }));
    if (res.error) {
      throw new Error(res.payload || 'Không thể cập nhật khách sạn');
    }
    const needsResubmit = ['cho_duyet', 'tu_choi', 'yeu_cau_sua'].includes(hotel.trang_thai);
    setLocalSuccess(
      needsResubmit
        ? 'Đã gửi duyệt lại cho admin!'
        : 'Sửa khách sạn thành công!'
    );
    dispatch(clearMsg());
    setFormVersion((v) => v + 1);
  };

  if (isEdit && !hotel && (loading || list.length === 0)) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (isEdit && !hotel && list.length > 0) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy khách sạn</p>
        <BackButton variant="outline" onClick={() => navigate('/partner/hotels')} />
      </div>
    );
  }

  return (
    <div>
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle={isEdit ? `Chỉnh sửa: ${hotel?.ten}` : 'Thêm khách sạn mới'}
        onBack={() => navigate('/partner/hotels')}
      />

      <div className="content-card">
        {localSuccess && (
          <div className="mgmt-toast success">{localSuccess}</div>
        )}
        <HotelFormContent
          key={isEdit ? `${hotel?.ma_khach_san}-${formVersion}` : 'new'}
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
