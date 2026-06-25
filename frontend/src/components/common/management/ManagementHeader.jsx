import { Plus } from 'lucide-react';
import BackButton from '../BackButton';

const ManagementHeader = ({
  title,
  subtitle,
  backTo,
  onBack,
  backLabel,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
}) => (
  <div className="mgmt-header">
    <div className="mgmt-header-main">
      <h1 className="mgmt-title">{title}</h1>
      {subtitle && <p className="mgmt-subtitle">{subtitle}</p>}
      {(backTo || onBack) && (
        <BackButton to={backTo} onClick={onBack} label={backLabel} />
      )}
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
