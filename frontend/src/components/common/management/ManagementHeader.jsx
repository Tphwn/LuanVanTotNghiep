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
}) => {
  const hasBack = Boolean(backTo || onBack);
// header quản lý các trang admin, partner, user
  return (
    <div className="mgmt-header">
      {hasBack && (
        <BackButton
          to={backTo}
          onClick={onBack}
          label={backLabel}
          className="page-back-btn--standalone"
        />
      )}
      <div className="mgmt-header-row">
        <div className="mgmt-header-main">
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
    </div>
  );
};

export default ManagementHeader;
