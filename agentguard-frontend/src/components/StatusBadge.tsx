import React from 'react';

interface Props {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const norm = status?.toUpperCase() ?? '';
  const cls =
    norm === 'ALLOWED'    ? 'badge-allowed'  :
    norm === 'BLOCKED'    ? 'badge-blocked'  :
    norm === 'FAILED'     ? 'badge-failed'   :
    norm === 'PENDING'    ? 'badge-pending'  :
    norm === 'ACTIVE'     ? 'badge-active'   :
    norm === 'INACTIVE'   ? 'badge-inactive' :
    norm === 'OPEN'       ? 'badge-open'     :
    norm === 'RESOLVED'   ? 'badge-resolved' :
    norm === 'APPROVED'   ? 'badge-allowed'  :
    norm === 'REJECTED'   ? 'badge-blocked'  :
    norm === 'COMPLETED'  ? 'badge-allowed'  :
    'badge-inactive';
  return <span className={`badge ${cls} ${className}`}>{norm}</span>;
};
