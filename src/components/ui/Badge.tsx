import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-ivory-dark text-text-muted',
  primary: 'bg-burgundy/10 text-burgundy',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
