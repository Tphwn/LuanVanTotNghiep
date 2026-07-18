-- Drop unused/redundant columns from khach_san
-- Commission rate stays on doi_tac; cancel details stay in chinh_sach_huy

ALTER TABLE `khach_san`
  DROP COLUMN `phan_tram_hoa_hong`,
  DROP COLUMN `hoan_khi_benh`,
  DROP COLUMN `hoan_cong_viec_dot_xuat`,
  DROP COLUMN `yeu_cau_minh_chung_huy`,
  DROP COLUMN `mo_ta_chinh_sach_huy`;
