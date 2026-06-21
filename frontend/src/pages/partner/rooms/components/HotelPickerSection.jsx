import HotelPickerCard from './HotelPickerCard';

export default function HotelPickerSection({
  hotels,
  hotelStats,
  selectedHotel,
  onSelectHotel,
  onNavigateToHotels,
}) {
  return (
    <>
      {hotels.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <p className="empty-state-text" style={{ marginBottom: 16 }}>
              Bạn chưa có khách sạn nào. Hãy thêm khách sạn trước khi tạo loại phòng.
            </p>
            <button type="button" className="btn btn-primary" onClick={onNavigateToHotels}>
              + Thêm khách sạn
            </button>
          </div>
        </div>
      ) : (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Chọn khách sạn để quản lý</h3>
            <span style={{ fontSize: 13, color: '#5a7a72' }}>{hotels.length} cơ sở</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {hotels.map((hotel) => (
              <HotelPickerCard
                key={hotel.ma_khach_san}
                hotel={hotel}
                stats={hotelStats[hotel.ma_khach_san]}
                selected={selectedHotel}
                onSelect={onSelectHotel}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
