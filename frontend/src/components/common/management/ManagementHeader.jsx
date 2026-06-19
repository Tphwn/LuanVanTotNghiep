import { Plus } from 'lucide-react';

const ManagementHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon = Plus }) => (
  <div className="mgmt-header">
    <div>
      <h1 className="mgmt-title">{title}</h1>
      {subtitle && <p className="mgmt-subtitle">{subtitle}</p>}
    </div>
    {actionLabel && onAction && (
      <button type="button" className="btn btn-primary mgmt-header-action" onClick={onAction}>
        <ActionIcon size={18} strokeWidth={2.5} />
        {actionLabel}
      </button>
    )}
  </div>
);

export default ManagementHeader;
