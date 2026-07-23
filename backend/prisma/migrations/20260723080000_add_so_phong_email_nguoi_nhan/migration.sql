-- Số phòng đặt trong đơn + email liên hệ người nhận (có thể khác email tài khoản)
ALTER TABLE `dat_phong`
  ADD COLUMN `so_phong` INTEGER NOT NULL DEFAULT 1 AFTER `so_khach`,
  ADD COLUMN `email_nguoi_nhan` VARCHAR(100) NULL AFTER `sdt_nguoi_nhan`;
