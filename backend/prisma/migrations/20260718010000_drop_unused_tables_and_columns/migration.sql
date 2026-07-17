-- Drop unused tables (replaced / never used in app)
DROP TABLE IF EXISTS `doi_soat`;
DROP TABLE IF EXISTS `cau_hinh_he_thong`;
DROP TABLE IF EXISTS `khach_hang_khuyen_mai`;

-- Drop unused / duplicate columns
ALTER TABLE `dat_phong` DROP COLUMN `ma_xac_nhan`;
ALTER TABLE `dia_diem` DROP COLUMN `slug`;
ALTER TABLE `doi_tac` DROP COLUMN `email_lien_he`;
ALTER TABLE `doi_tac` DROP COLUMN `so_dien_thoai`;
