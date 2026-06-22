"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  total: { label: "Revenu", color: "var(--primary)" },
} satisfies ChartConfig;

export function CourbeEvolution({
  data,
}: {
  data: { label: string; labelLong: string; total: number }[];
}) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Aucun encaissement sur cette période.</p>;
  }

  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.labelLong ?? ""}
            />
          }
        />
        <Line
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
