import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, createRoom, updateRoom, deleteRoom } from '../../../store/slices/partnerRoomSlice';
import { fetchAmenitiesForHotel, fetchMyHotels } from '../../../store/slices/partnerHotelSlice';
import RoomFormModal from './RoomFormModal';

const RoomTypePage = ({ ma_khach_san }) => {
  const dispatch = useDispatch();
  
  // Lấy dữ liệu từ Store
  const { list } = useSelector(s => s.partnerRooms);
  const { amenities, myHotels } = useSelector(s => s.partnerHotel || { amenities: [], myHotels: [] });
  
  const [modal, setModal] = useState(null);

  useEffect(() => { 
    // Chỉ gọi API phòng khi đã có mã khách sạn để tránh lỗi 500
    if (ma_khach_san) {
      dispatch(fetchRooms(ma_khach_san));
    }
    dispatch(fetchAmenitiesForHotel());
    dispatch(fetchMyHotels()); 
  }, [dispatch, ma_khach_san]);

  const handleSubmit = (formData) => {
    // Tạo FormData để xử lý file ảnh chuẩn xác
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'tien_nghi_ids') {
        // Gửi array tiện nghi đúng định dạng cho Backend
        formData[key].forEach(id => data.append('tien_nghi_ids[]', id));
      } else if (key === 'file' && formData.file) {
        data.append('file', formData.file);
      } else {
        data.append(key, formData[key]);
      }
    });

    // Nếu form không có ma_khach_san thì lấy từ props
    if (!formData.ma_khach_san) {
      data.append('ma_khach_san', ma_khach_san);
    }

    if (modal === 'add') {
      dispatch(createRoom(data));
    } else {
      dispatch(updateRoom({ id: modal.ma_loai_phong, data }));
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
              <th>Số phòng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th> 
            </tr>
          </thead>
          <tbody>
            {/* Sử dụng list && để tránh crash nếu dữ liệu chưa về */}
            {list && list.map(r => (
              <tr key={r.ma_loai_phong}>
                <td>LP-{r.ma_loai_phong}</td>
                <td>{r.ten_loai}</td>
                <td>{r.khach_san?.ten || 'N/A'}</td> 
                <td>{Number(r.gia_co_ban || 0).toLocaleString()} đ</td>
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
          onClose={() => setModal(null)} 
          onSubmit={handleSubmit}
          initialData={modal === 'add' ? null : modal}
        />
      )}
    </div>
  );
};

export default RoomTypePage;