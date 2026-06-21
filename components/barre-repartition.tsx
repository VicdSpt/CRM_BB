import { formatEuros } from "@/lib/finances/format";
import { pourcentage } from "@/lib/finances/pourcentage";

export function BarreRepartition({
  label,
  montant,
  total,
}: {
  label: string;
  montant: string;
  total: string;
}) {
  const pct = pourcentage(Number(montant), Number(total));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">{formatEuros(montant)}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
