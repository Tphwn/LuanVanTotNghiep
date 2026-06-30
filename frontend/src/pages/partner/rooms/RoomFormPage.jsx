import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';
import RoomFormContent from './RoomFormModal';

export default function RoomFormPage() {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(roomId);
  const listPath = `/partner/hotels/${hotelId}/rooms`;

  const [room, setRoom] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [amenitiesRes, hotelsRes] = await Promise.all([
          api.get('/partner/rooms/amenities'),
          api.get('/partner/hotels'),
        ]);
        setAmenities(amenitiesRes.data.data || []);
        const hotels = hotelsRes.data.data || [];
        const hotel = hotels.find((h) => String(h.ma_khach_san) === String(hotelId));
        setHotelName(hotel?.ten || '');

        if (isEdit) {
          const roomsRes = await api.get(`/partner/rooms?hotelId=${hotelId}`);
          const rooms = roomsRes.data.data || [];
          const found = rooms.find((r) => String(r.ma_loai_phong) === String(roomId));
          setRoom(found || null);
        }
      } catch {
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hotelId, roomId, isEdit]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (isEdit && !room) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy loại phòng</p>
        <BackButton variant="outline" onClick={() => navigate(listPath)} />
      </div>
    );
  }

  return (
    <div>
      <ManagementHeader
        title="Quản Lý Loại Phòng"
        subtitle={
          isEdit
            ? `Chỉnh sửa loại phòng cho khách sạn: ${hotelName}`
            : `Thêm loại phòng mới cho khách sạn:  ${hotelName}`
        }
        onBack={() => navigate(listPath)}
      />

      <div className="content-card">
        <RoomFormContent
          key={room?.ma_loai_phong || 'new'}
          room={room}
          hotelId={Number(hotelId)}
          amenities={amenities}
          onClose={() => navigate(listPath)}
          onSuccess={() => navigate(listPath)}
        />
      </div>
    </div>
  );
}
