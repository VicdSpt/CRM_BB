import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-4">
        <Skeleton className="h-8 w-36" />
      </header>

      {/* Filtres */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Total encaissé */}
      <Skeleton className="mb-6 h-24 w-full" />

      {/* Évolution (courbe) */}
      <Skeleton className="mb-6 h-56 w-full" />

      {/* Répartition (camembert) */}
      <Skeleton className="mb-6 h-56 w-full" />

      {/* Impayés */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}
