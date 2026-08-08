-- Không còn trạng thái yêu cầu bổ sung / yêu cầu sửa cho khách sạn
ALTER TABLE `khach_san`
  MODIFY COLUMN `trang_thai` ENUM(
    'cho_duyet',
    'da_duyet',
    'tu_choi',
    'hoat_dong',
    'bi_khoa'
  ) NOT NULL DEFAULT 'cho_duyet';
