import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAmenities,
  addAmenity,
  updateAmenity,
  removeAmenity,
} from "../../../store/slices/amenitySlice";

const AmenitiesPage = () => {
  const dispatch = useDispatch();
  // Giả sử reducer của bạn đặt tên là 'amenities'
  const { list = [], loading = false } = useSelector((state) => state.amenities || {});

  // State cho Form và Filter
  const [form, setForm] = useState({ ten: "", bieu_tuong: "", loai: "khach_san" });
  const [editId, setEditId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [filterLoai, setFilterLoai] = useState("all");

  useEffect(() => {
    dispatch(fetchAmenities());
  }, [dispatch]);

  // ===== LOGIC LỌC =====
  const filteredList = list.filter((item) => {
    const matchLoai = filterLoai === "all" || item.loai === filterLoai;
    const matchKeyword = item.ten?.toLowerCase().includes(keyword.toLowerCase());
    return matchLoai && matchKeyword;
  });

  // ===== HÀM XỬ LÝ =====
  const handleSubmit = () => {
    if (!form.ten.trim()) return alert("Vui lòng nhập tên tiện nghi");

    if (editId) {
      dispatch(updateAmenity({ id: editId, data: form }));
      setEditId(null);
    } else {
      dispatch(addAmenity(form));
    }
    setForm({ ten: "", bieu_tuong: "", loai: "khach_san" });
  };

  const handleEdit = (item) => {
    setEditId(item.ma_tien_nghi);
    setForm({ ten: item.ten, bieu_tuong: item.bieu_tuong, loai: item.loai });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa tiện nghi này?")) {
      dispatch(removeAmenity(id));
    }
  };

  return (
    <div className="main-panel">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Tiện nghi</h1>
          <p className="page-subtitle">Thêm, sửa, xóa các tiện nghi hỗ trợ khách sạn/phòng</p>
        </div>
      </div>

      {/* ===== FORM THÊM/SỬA ===== */}
      <div className="content-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Tên tiện nghi</label>
            <input
              className="search-input"
              style={{ width: '100%' }}
              value={form.ten}
              onChange={(e) => setForm({ ...form, ten: e.target.value })}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Icon</label>
            <input
              className="search-input"
              style={{ width: '100%' }}
              value={form.bieu_tuong}
              onChange={(e) => setForm({ ...form, bieu_tuong: e.target.value })}
              placeholder="🏨"
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Loại</label>
            <select className="search-input" style={{ width: '100%' }} value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value })}>
              <option value="khach_san">Khách sạn</option>
              <option value="phong">Phòng</option>
              <option value="ca_hai">Cả hai</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editId ? "Cập nhật" : "Thêm mới"}
            </button>
            {editId && <button className="btn btn-outline" onClick={() => {setEditId(null); setForm({ten:"", bieu_tuong:"", loai:"khach_san"})}}>Hủy</button>}
          </div>
        </div>
      </div>

      {/* ===== BỘ LỌC ===== */}
      <div className="search-bar" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="search-input" placeholder="🔍 Tìm kiếm tên..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <select className="search-input" value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)}>
          <option value="all">Tất cả loại</option>
          <option value="khach_san">Khách sạn</option>
          <option value="phong">Phòng</option>
          <option value="ca_hai">Cả hai</option>
        </select>
      </div>

      {/* ===== BẢNG DỮ LIỆU ===== */}
      <div className="content-card">
        {loading ? <p>Đang tải...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Icon</th>
                <th>Loại</th>
                <th style={{ textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.ma_tien_nghi}>
                  <td>#{item.ma_tien_nghi}</td>
                  <td>{item.ten}</td>
                  <td>{item.bieu_tuong}</td>
                  <td><span className="badge badge-info">{item.loai}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(item)}>Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.ma_tien_nghi)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AmenitiesPage;