export function JaugePack({ restantes, total }: { restantes: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((restantes / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">
        {restantes}/{total} séances restantes
      </span>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
