-- Thêm trạng thái đã thanh toán đối tác + ngày thanh toán
ALTER TABLE `hoa_hong`
  MODIFY COLUMN `trang_thai` ENUM('chua_thu', 'da_thu', 'tam_giu', 'da_thanh_toan') NOT NULL DEFAULT 'chua_thu';

ALTER TABLE `hoa_hong`
  ADD COLUMN `ngay_thanh_toan_doi_tac` DATETIME(0) NULL;
