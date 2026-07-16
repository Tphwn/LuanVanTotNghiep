-- Audit đối soát hoa hồng
ALTER TABLE `hoa_hong`
  ADD COLUMN `ngay_doi_soat` DATETIME(0) NULL,
  ADD COLUMN `doi_soat_boi_id` INT NULL,
  ADD COLUMN `ghi_chu` TEXT NULL;

ALTER TABLE `hoa_hong`
  ADD INDEX `fk_hh_admin` (`doi_soat_boi_id`),
  ADD CONSTRAINT `fk_hh_admin`
    FOREIGN KEY (`doi_soat_boi_id`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;
