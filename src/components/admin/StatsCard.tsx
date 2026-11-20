interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="border border-border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-serif text-text mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-text-muted/40">{icon}</div>
        )}
      </div>
    </div>
  );
}
