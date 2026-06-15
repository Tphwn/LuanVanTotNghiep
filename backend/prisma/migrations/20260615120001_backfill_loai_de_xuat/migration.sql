UPDATE `yeu_cau_tien_nghi` SET `loai_de_xuat` = 'phong' WHERE `loai_de_xuat` IS NULL AND (`mo_ta` LIKE '%loại phòng%' OR `mo_ta` LIKE '%loai phong%');
UPDATE `yeu_cau_tien_nghi` SET `loai_de_xuat` = 'khach_san' WHERE `loai_de_xuat` IS NULL AND (`mo_ta` LIKE '%khách sạn%' OR `mo_ta` LIKE '%khach san%');
