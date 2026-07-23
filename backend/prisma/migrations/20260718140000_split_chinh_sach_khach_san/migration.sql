-- Split hotel accommodation policy fields into chinh_sach_khach_san (1-1)

CREATE TABLE `chinh_sach_khach_san` (
  `ma_khach_san` INT NOT NULL,
  `giay_to_bat_buoc` TEXT NULL,
  `cho_phep_hut_thuoc` BOOLEAN NOT NULL DEFAULT false,
  `cho_phep_to_chuc_tiec` BOOLEAN NOT NULL DEFAULT false,
  `cho_phep_thu_cung` BOOLEAN NOT NULL DEFAULT false,
  `phu_thu_thu_cung` DECIMAL(12, 0) NULL,
  `tuoi_toi_da_mien_phi` TINYINT NULL,
  `phu_thu_tre_em` DECIMAL(12, 0) NULL,
  `noi_quy_khac` TEXT NULL,
  PRIMARY KEY (`ma_khach_san`),
  CONSTRAINT `fk_csks_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE CASCADE ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `chinh_sach_khach_san` (
  `ma_khach_san`,
  `giay_to_bat_buoc`,
  `cho_phep_hut_thuoc`,
  `cho_phep_to_chuc_tiec`,
  `cho_phep_thu_cung`,
  `phu_thu_thu_cung`,
  `tuoi_toi_da_mien_phi`,
  `phu_thu_tre_em`,
  `noi_quy_khac`
)
SELECT
  `ma_khach_san`,
  `giay_to_bat_buoc`,
  `cho_phep_hut_thuoc`,
  `cho_phep_to_chuc_tiec`,
  `cho_phep_thu_cung`,
  `phu_thu_thu_cung`,
  `tuoi_toi_da_mien_phi`,
  `phu_thu_tre_em`,
  `noi_quy_khac`
FROM `khach_san`;

ALTER TABLE `khach_san`
  DROP COLUMN `giay_to_bat_buoc`,
  DROP COLUMN `cho_phep_hut_thuoc`,
  DROP COLUMN `cho_phep_to_chuc_tiec`,
  DROP COLUMN `cho_phep_thu_cung`,
  DROP COLUMN `phu_thu_thu_cung`,
  DROP COLUMN `tuoi_toi_da_mien_phi`,
  DROP COLUMN `phu_thu_tre_em`,
  DROP COLUMN `noi_quy_khac`;
