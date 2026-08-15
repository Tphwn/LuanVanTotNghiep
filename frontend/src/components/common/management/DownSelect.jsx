import { Children, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const collectOptions = (children) => {
  const list = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      list.push({
        value: child.props.value ?? '',
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      });
      return;
    }
    if (child.props?.children) {
      list.push(...collectOptions(child.props.children));
    }
  });
  return list;
};

export default function DownSelect({
  id,
  className = '',
  value,
  onChange,
  options: optionsProp,
  children,
  disabled = false,
  style,
  name,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const options = useMemo(
    () => (Array.isArray(optionsProp) && optionsProp.length ? optionsProp : collectOptions(children)),
    [optionsProp, children],
  );
  const selected = options.find((opt) => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const emit = (nextValue) => {
    onChange?.({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
    });
    setOpen(false);
  };

  return (
    <div className={`down-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        className={`down-select-trigger ${className}`.trim()}
        disabled={disabled}
        style={style}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="down-select-label">{selected?.label || '—'}</span>
        <ChevronDown size={16} className="down-select-caret" aria-hidden />
      </button>
      {open && (
        <ul className="down-select-menu" role="listbox">
          {options.map((opt, index) => {
            const isActive = String(opt.value) === String(value);
            return (
              <li
                key={`${String(opt.value)}-${index}`}
                role="option"
                aria-selected={isActive}
                aria-disabled={opt.disabled || undefined}
                className={`down-select-option${isActive ? ' is-active' : ''}${opt.disabled ? ' is-disabled' : ''}`}
                onClick={() => {
                  if (!opt.disabled) emit(opt.value);
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
