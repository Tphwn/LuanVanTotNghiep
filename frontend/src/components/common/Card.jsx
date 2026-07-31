
const Card = ({ children, style = {}, padding = 'var(--spacing-xl)', className = '' }) => {
  return (
    <div
      className={className || undefined}
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
