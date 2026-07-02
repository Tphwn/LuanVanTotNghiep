-- AlterTable
ALTER TABLE `khach_san`
    ADD COLUMN `giay_to_bat_buoc` TEXT NULL,
    ADD COLUMN `cho_phep_hut_thuoc` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cho_phep_to_chuc_tiec` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cho_phep_thu_cung` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `phu_thu_thu_cung` DECIMAL(12, 0) NULL,
    ADD COLUMN `tuoi_toi_da_mien_phi` TINYINT NULL,
    ADD COLUMN `phu_thu_tre_em` DECIMAL(12, 0) NULL;
