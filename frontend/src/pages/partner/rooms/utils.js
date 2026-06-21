export const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

export const getMainImage = (item) => {
  const imgs = item?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh === 1 || i.la_anh_chinh === true) || imgs[0];
};
