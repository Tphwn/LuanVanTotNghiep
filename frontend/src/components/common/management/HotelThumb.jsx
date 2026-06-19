import { Building2 } from 'lucide-react';
import { resolveUploadUrl } from '../../../utils/media';

const HotelThumb = ({ hotel, size = 40 }) => {
  const imgs = hotel?.hinh_anh || [];
  const thumb = imgs.find((i) => i.la_anh_chinh) || imgs[0];

  return (
    <div className="mgmt-thumb" style={{ width: size, height: size }}>
      {thumb ? (
        <img src={resolveUploadUrl(thumb.url)} alt="" />
      ) : (
        <Building2 size={20} strokeWidth={1.5} />
      )}
    </div>
  );
};

export default HotelThumb;
