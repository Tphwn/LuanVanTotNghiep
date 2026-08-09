import { useEffect, useId, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { displayDateToIso, isoToDisplayDate } from '../../utils/formatDate';
//component chọn ngày tháng năm
export default function DateInput({
  value = '',
  onChange,
  className = '',
  style,
  min,
  max,
  id,
  disabled = false,
  required = false,
  name,
  'aria-label': ariaLabel,
  placeholder = 'dd/mm/yyyy',
}) {
  const reactId = useId();
  const inputId = id || reactId;
  const nativeRef = useRef(null);
  const [text, setText] = useState(() => isoToDisplayDate(value));

  useEffect(() => {
    setText(isoToDisplayDate(value));
  }, [value]);

  const emit = (iso) => {
    onChange?.({
      target: { value: iso, name },
      currentTarget: { value: iso, name },
    });
  };

  const clampIso = (iso) => {
    if (!iso) return iso;
    if (min && iso < min) return min;
    if (max && iso > max) return max;
    return iso;
  };

  const commitText = () => {
    const parsed = displayDateToIso(text);
    if (parsed === null) {
      setText(isoToDisplayDate(value));
      return;
    }
    const next = clampIso(parsed);
    emit(next);
    setText(isoToDisplayDate(next));
  };

  const openNativePicker = () => {
    if (disabled) return;
    const el = nativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        /* fallback click */
      }
    }
    el.click();
  };

  const handleNativeChange = (e) => {
    const next = clampIso(e.target.value || '');
    emit(next);
    setText(isoToDisplayDate(next));
  };

  return (
    <div
      className={`date-input${className ? ` ${className}` : ''}`}
      style={style}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        id={inputId}
        type="text"
        className="date-input__text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        required={required}
        name={name}
        aria-label={ariaLabel}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitText();
          }
        }}
      />
      <button
        type="button"
        className="date-input__calendar-btn"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Mở lịch"
        onClick={openNativePicker}
      >
        <Calendar size={16} strokeWidth={2} />
      </button>
      <input
        ref={nativeRef}
        type="date"
        className="date-input__native"
        value={value || ''}
        min={min || undefined}
        max={max || undefined}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleNativeChange}
      />
    </div>
  );
}
