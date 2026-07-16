-- Thêm google_id cho đăng nhập Google (không đổi mat_khau / so_dien_thoai hiện có)
ALTER TABLE `nguoi_dung`
  ADD COLUMN `google_id` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `uq_nguoi_dung_google_id` ON `nguoi_dung`(`google_id`);
