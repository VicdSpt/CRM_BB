import { redirect } from "next/navigation";

// Les finances sont désormais dans le profil du coach : les anciens liens y mènent.
export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(await searchParams)) {
    if (typeof valeur === "string") params.set(cle, valeur);
  }
  const query = params.toString();
  redirect(`/profil${query ? `?${query}` : ""}#finances`);
}
