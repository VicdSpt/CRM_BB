"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatEuros } from "@/lib/finances/format";

const config = {
  montant: { label: "Montant" },
  prive: { label: "Cours privés", color: "var(--primary)" },
  collectif: { label: "Cours collectifs", color: "oklch(0.6 0.15 230)" },
  pack: { label: "Packs", color: "oklch(0.75 0.15 80)" },
} satisfies ChartConfig;

export function CamembertRepartition({
  prive,
  collectif,
  pack,
}: {
  prive: string;
  collectif: string;
  pack: string;
}) {
  const data = [
    { cle: "prive", montant: Number(prive), fill: "var(--color-prive)" },
    {
      cle: "collectif",
      montant: Number(collectif),
      fill: "var(--color-collectif)",
    },
    { cle: "pack", montant: Number(pack), fill: "var(--color-pack)" },
  ];
  const total = data.reduce((acc, d) => acc + d.montant, 0);

  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Rien à répartir.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={config} className="aspect-square h-[180px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="cle" hideLabel />} />
          <Pie data={data} dataKey="montant" nameKey="cle" innerRadius={45} />
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.cle} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.fill }} />
            <span>{config[d.cle as "prive" | "collectif" | "pack"].label}</span>
            <span className="text-muted-foreground tabular-nums">{formatEuros(d.montant)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
