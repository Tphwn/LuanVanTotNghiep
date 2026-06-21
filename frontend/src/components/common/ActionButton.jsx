const VARIANT_CLASS = {
  view: 'btn-action-view',
  edit: 'btn-action-edit',
  approve: 'btn-action-approve',
  reject: 'btn-action-reject',
  lock: 'btn-action-lock',
  unlock: 'btn-action-unlock',
  delete: 'btn-action-delete',
  request: 'btn-action-request',
  reply: 'btn-action-reply',
  confirm: 'btn-action-confirm',
  hide: 'btn-action-lock',
  show: 'btn-action-unlock',
};

export const TableActions = ({ children, className = '', style }) => (
  <div className={`table-actions${className ? ` ${className}` : ''}`} style={style}>
    {children}
  </div>
);

export const ActionCell = ({ children }) => (
  <td className="table-action-cell">
    <div className="table-actions table-actions-nowrap">{children}</div>
  </td>
);

const ActionButton = ({ variant = 'view', className = '', children, icon: Icon, iconOnly = false, ...props }) => {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.view;
  const title = props.title || (typeof children === 'string' ? children : undefined);
  return (
    <button
      type="button"
      className={`btn btn-action ${iconOnly ? 'btn-action-icon' : 'btn-action-compact'} ${variantClass}${className ? ` ${className}` : ''}`}
      title={title}
      aria-label={title}
      {...props}
    >
      {Icon && <Icon size={iconOnly ? 15 : 14} strokeWidth={2} />}
      {!iconOnly && children}
    </button>
  );
};

export default ActionButton;
