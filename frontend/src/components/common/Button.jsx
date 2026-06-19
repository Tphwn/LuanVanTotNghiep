
const variants = {
  primary: { 
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: 'none',
  },
  success: {//
    background: 'var(--color-success)',
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: '#fff',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
};

const sizes = {
  sm: { padding: '5px 12px',  fontSize: 'var(--font-size-sm)'},
  md: { padding:'9px 20px',  fontSize: 'var(--font-size-md)'},
  lg: { padding:'12px 28px', fontSize: 'var(--font-size-lg)'},
};

const Button = ({
  children,
  variant ='primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  style = {},
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed':'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%':'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'opacity 0.15s, background 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => { 
        if (!disabled && !loading) {
          if (variant === 'primary') e.target.style.background = 'var(--color-primary-hover)';
          if (variant === 'danger') e.target.style.background = 'var(--color-danger-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.target.style.background = 'var(--color-primary)';
        if (variant === 'danger') e.target.style.background = 'var(--color-danger)';
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: '14px', height: '14px',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
          Đang xử lý...
        </>
      ) : children}
    </button>
  );
};

export default Button;