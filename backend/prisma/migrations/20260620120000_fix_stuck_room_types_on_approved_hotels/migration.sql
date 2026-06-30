-- Khôi phục loại phòng bị ẩn do logic cũ (tạo khi KS còn chờ duyệt).
UPDATE `loai_phong` lp
INNER JOIN `khach_san` ks ON lp.`ma_khach_san` = ks.`ma_khach_san`
SET lp.`trang_thai` = 'hoat_dong',
    lp.`so_luong_mo_ban` = lp.`so_luong_phong`
WHERE ks.`trang_thai` = 'hoat_dong'
  AND lp.`so_luong_mo_ban` = 0
  AND lp.`so_luong_phong` > 0
  AND (
    lp.`trang_thai` = 'an'
    OR (lp.`trang_thai` = 'hoat_dong' AND lp.`ngay_tao` <= ks.`ngay_duyet`)
  );
