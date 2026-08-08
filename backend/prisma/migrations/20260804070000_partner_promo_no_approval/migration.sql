-- KM đối tác không còn chờ duyệt: chuyển cho_duyet → hoat_dong / het_han
UPDATE khuyen_mai
SET trang_thai = 'het_han',
    ly_do = NULL
WHERE loai_nguon = 'doi_tac'
  AND trang_thai = 'cho_duyet'
  AND ngay_ket_thuc < CURDATE();

UPDATE khuyen_mai
SET trang_thai = 'hoat_dong',
    ly_do = NULL
WHERE loai_nguon = 'doi_tac'
  AND trang_thai = 'cho_duyet'
  AND ngay_ket_thuc >= CURDATE();
