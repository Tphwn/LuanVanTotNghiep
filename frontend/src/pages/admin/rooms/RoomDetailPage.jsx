import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const RoomDetailPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    // Placeholder: in real app fetch detail from API
    setRoom({ id, hotel: 'Hotel Example', type: 'Deluxe', guests: 2, price: '1.200.000đ', description: 'Phòng đẹp, view sông.' });
  }, [id]);

  if (!room) return <div>Đang tải...</div>;

  return (
    <div>
      <h1>Chi tiết loại phòng {room.id}</h1>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
        <p><strong>Khách sạn:</strong> {room.hotel}</p>
        <p><strong>Loại phòng:</strong> {room.type}</p>
        <p><strong>Số khách:</strong> {room.guests}</p>
        <p><strong>Giá/đêm:</strong> {room.price}</p>
        <p><strong>Mô tả:</strong> {room.description}</p>
      </div>
    </div>
  );
};

export default RoomDetailPage;
