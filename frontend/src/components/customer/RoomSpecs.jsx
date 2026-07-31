import { Users, Maximize2, BedDouble } from 'lucide-react';

const RoomSpecs = ({ sucChua, dienTich, soGiuong, bedLabel }) => {
  const bedText = bedLabel || (soGiuong != null ? `${soGiuong} giường` : null);

  return (
    <div className="room-specs-row">
      {sucChua != null && (
        <span className="room-spec-item">
          <Users size={16} strokeWidth={2} aria-hidden />
          {sucChua}
        </span>
      )}
      {dienTich != null && (
        <span className="room-spec-item">
          <Maximize2 size={16} strokeWidth={2} aria-hidden />
          {dienTich}
          {' '}
          m²
        </span>
      )}
      {bedText && (
        <span className="room-spec-item">
          <BedDouble size={16} strokeWidth={2} aria-hidden />
          {bedText}
        </span>
      )}
    </div>
  );
};

export default RoomSpecs;
