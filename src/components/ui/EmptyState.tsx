import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'There are no items to display.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-4 text-text-muted">
        {icon || <PackageOpen size={48} strokeWidth={1} />}
      </div>
      <h3 className="font-serif text-xl text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-md">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
