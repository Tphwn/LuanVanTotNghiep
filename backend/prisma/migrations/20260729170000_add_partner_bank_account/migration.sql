-- AlterTable
ALTER TABLE `doi_tac`
  ADD COLUMN `so_tai_khoan` VARCHAR(50) NULL,
  ADD COLUMN `ten_chu_tai_khoan` VARCHAR(150) NULL,
  ADD COLUMN `ma_ngan_hang` VARCHAR(20) NULL,
  ADD COLUMN `ten_ngan_hang` VARCHAR(150) NULL,
  ADD COLUMN `logo_ngan_hang` VARCHAR(255) NULL;
