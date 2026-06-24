
const PriceRangeSlider = ({ min, max, valueMin, valueMax, onChange }) => {
  const floor = Number(min) || 0;
  const ceiling = Number(max) || floor;
  const span = Math.max(ceiling - floor, 1);

  const localMin = valueMin === '' ? floor : Math.max(floor, Number(valueMin));
  const localMax = valueMax === '' ? ceiling : Math.min(ceiling, Number(valueMax));

  const pctMin = ((localMin - floor) / span) * 100;
  const pctMax = ((localMax - floor) / span) * 100;

  const handleMin = (raw) => {
    const next = Math.min(Number(raw), localMax);
    onChange({ min: next, max: localMax });
  };

  const handleMax = (raw) => {
    const next = Math.max(Number(raw), localMin);
    onChange({ min: localMin, max: next });
  };

  if (ceiling <= floor) return null;

  return (
    <div className="price-range-slider">
      <div className="price-range-track">
        <div
          className="price-range-fill"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          className="price-range-thumb price-range-thumb-min"
          min={floor}
          max={ceiling}
          step={Math.max(Math.round(span / 100), 10000)}
          value={localMin}
          onChange={(e) => handleMin(e.target.value)}
        />
        <input
          type="range"
          className="price-range-thumb price-range-thumb-max"
          min={floor}
          max={ceiling}
          step={Math.max(Math.round(span / 100), 10000)}
          value={localMax}
          onChange={(e) => handleMax(e.target.value)}
        />
      </div>
      <div className="price-range-values">
        <span>{localMin.toLocaleString('vi-VN')} ₫</span>
        <span>{localMax.toLocaleString('vi-VN')} ₫</span>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
