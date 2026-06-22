import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </header>
      <Skeleton className="mb-4 h-9 w-full" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-16 w-full" />
          </li>
        ))}
      </ul>
    </main>
  );
}
