import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  inputMode,
  maxLength,
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 'var(--spacing-md)', width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 'var(--spacing-xs)',
          fontSize: 'var(--font-size-md)',
          fontWeight: 500,
          color: 'var(--color-text)',
        }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '10px 14px',
            paddingRight: isPassword ? '44px' : '14px',
            border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text)',
            background: disabled ? '#f5f5f5' : '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            boxShadow: focused ? '0 0 0 2px rgba(3, 12, 8, 0.1)' : 'none',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
              background: 'none',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        )}
      </div>

      {error && (
        <p style={{
          margin: '4px 0 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-danger)',
        }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;