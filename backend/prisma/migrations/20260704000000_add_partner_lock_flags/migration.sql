-- Khóa/mở khóa đối tác: đánh dấu KS & loại phòng bị khóa theo tài khoản đối tác
ALTER TABLE `khach_san`
  ADD COLUMN `khoa_do_doi_tac` BOOLEAN NOT NULL DEFAULT false AFTER `ly_do_tu_choi`;

ALTER TABLE `loai_phong`
  ADD COLUMN `khoa_do_doi_tac` BOOLEAN NOT NULL DEFAULT false AFTER `trang_thai`,
  ADD COLUMN `so_luong_mo_ban_truoc_khoa` INT NULL AFTER `khoa_do_doi_tac`;
