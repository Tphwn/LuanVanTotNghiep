import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchRooms, createRoom, updateRoom, deleteRoom } from '../../../store/slices/partnerRoomSlice';
import { fetchAmenitiesForHotel, fetchMyHotels } from '../../../store/slices/partnerHotelSlice';
import RoomFormModal from './RoomFormModal';

const RoomTypePage = ({ ma_khach_san }) => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  const queryMaKS = searchParams.get('ma_ks');
  const activeHotelId = ma_khach_san || queryMaKS || params?.hotelId;

  // Lấy dữ liệu từ Store
  // Lưu ý: Đảm bảo tên biến 'list' trong partnerHotelSlice khớp với cấu trúc store của bạn
  const { list } = useSelector(s => s.partnerRooms);
  const { amenities, list: myHotels } = useSelector(s => s.partnerHotel || { amenities: [], list: [] });
  
  const [modal, setModal] = useState(null);

  useEffect(() => { 
    // Chỉ gọi API khi đã có ID khách sạn để tránh lỗi 500
    if (activeHotelId) {
      dispatch(fetchRooms(activeHotelId));
    }
    dispatch(fetchAmenitiesForHotel());
    dispatch(fetchMyHotels()); 
  }, [dispatch, activeHotelId]);

  const handleSubmit = (formData) => {
    const maKS = formData.ma_khach_san || activeHotelId;
    let payload;

    // Kiểm tra nếu có file thì dùng FormData, nếu không thì dùng object bình thường
    if (formData.file instanceof File) {
      payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'tien_nghi_ids') {
          formData[key].forEach(id => payload.append('tien_nghi_ids', id));
        } else if (key === 'file') {
          payload.append('file', formData.file);
        } else {
          payload.append(key, formData[key]);
        }
      });
      if (!formData.ma_khach_san) payload.append('ma_khach_san', maKS);
    } else {
      payload = { ...formData, ma_khach_san: maKS };
      delete payload.file; // Xóa file rỗng nếu không có upload
    }

    if (modal === 'add') {
      dispatch(createRoom(payload));
    } else {
      dispatch(updateRoom({ id: modal.ma_loai_phong, data: payload }));
    }
    setModal(null);
  };

  return (
    <div className="main-panel">
      <div className="page-header">
        <h1>Quản lý loại phòng</h1>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Thêm phòng</button>
      </div>

      <div className="content-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã loại</th>
              <th>Tên loại</th>
              <th>Khách sạn</th>
              <th>Giá</th>
              <th>Số giường</th> {/* Đã thêm cột số giường */}
              <th>Số phòng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th> 
            </tr>
          </thead>
          <tbody>
            {list && list.map(r => (
              <tr key={r.ma_loai_phong}>
                <td>LP-{r.ma_loai_phong}</td>
                <td>{r.ten_loai}</td>
                <td>{r.khach_san?.ten || 'N/A'}</td> 
                <td>{Number(r.gia_co_ban || 0).toLocaleString()} đ</td>
                <td>{r.so_giuong || 0}</td> {/* Hiển thị số giường */}
                <td>{r.so_luong_phong}</td>
                <td>
                  <span className={`badge ${r.trang_thai === 'hoat_dong' ? 'badge-success' : 'badge-warning'}`}>
                    {r.trang_thai}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal(r)}>Sửa</button>
                  <button className="btn btn-danger btn-sm" onClick={() => dispatch(deleteRoom(r.ma_loai_phong))}>Ẩn</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <RoomFormModal 
          amenities={amenities || []}
          myHotels={myHotels || []} 
          defaultHotelId={activeHotelId}
          onClose={() => setModal(null)} 
          onSubmit={handleSubmit}
          initialData={modal === 'add' ? null : modal}
        />
      )}
    </div>
  );
};

export default RoomTypePage;