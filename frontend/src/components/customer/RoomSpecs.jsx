import { Users, Maximize2, BedDouble } from 'lucide-react';

const RoomSpecs = ({ sucChua, dienTich, soGiuong }) => (
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
        {dienTich} m²
      </span>
    )}
    {soGiuong != null && (
      <span className="room-spec-item">
        <BedDouble size={16} strokeWidth={2} aria-hidden />
        {soGiuong} giường
      </span>
    )}
  </div>
);

export default RoomSpecs;
