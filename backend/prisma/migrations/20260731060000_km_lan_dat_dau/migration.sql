
ALTER TABLE `khuyen_mai` ADD COLUMN `lan_dat_dau` BOOLEAN NOT NULL DEFAULT false;

UPDATE `khuyen_mai`
SET `lan_dat_dau` = true,
    `ngay_ket_thuc` = '2099-12-31'
WHERE `loai_nguon` = 'he_thong'
  AND UPPER(`ma_code`) = 'KMLDDT';
