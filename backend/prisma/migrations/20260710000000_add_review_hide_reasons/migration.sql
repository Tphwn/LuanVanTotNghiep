-- AlterTable
ALTER TABLE `danh_gia`
    ADD COLUMN `ly_do_an` TEXT NULL,
    ADD COLUMN `phan_hoi_bi_an` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ly_do_an_phan_hoi` TEXT NULL;
