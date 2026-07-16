-- Thêm trạng thái tạm giữ cho hoa hồng
ALTER TABLE `hoa_hong`
  MODIFY COLUMN `trang_thai` ENUM('chua_thu', 'da_thu', 'tam_giu') NOT NULL DEFAULT 'chua_thu';
