import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-32" />
      </header>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-9" />
      </div>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-20 w-full" />
          </li>
        ))}
      </ul>
    </main>
  );
}
