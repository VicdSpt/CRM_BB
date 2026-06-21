"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  vue: "jour" | "semaine";
  prevParam: string;
  nextParam: string;
  todayParam: string;
};

export function PlanningNavigation({ vue, prevParam, nextParam, todayParam }: Props) {
  const router = useRouter();
  const go = (date: string, v: "jour" | "semaine") =>
    router.push(`/planning?date=${date}&vue=${v}`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(prevParam, vue)}
          aria-label="Précédent"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(todayParam, vue)}>
          Aujourd&apos;hui
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(nextParam, vue)} aria-label="Suivant">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex gap-1">
        <Button
          variant={vue === "jour" ? "default" : "outline"}
          size="sm"
          onClick={() => go(todayParam, "jour")}
        >
          Jour
        </Button>
        <Button
          variant={vue === "semaine" ? "default" : "outline"}
          size="sm"
          onClick={() => go(todayParam, "semaine")}
        >
          Semaine
        </Button>
      </div>
    </div>
  );
}
