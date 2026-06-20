import { Prisma, type MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ZERO = new Prisma.Decimal(0);

export async function getRevenuTotal(
  debut: Date,
  fin: Date,
  methode?: MethodePaiement,
): Promise<Prisma.Decimal> {
  const r = await prisma.paiement.aggregate({
    _sum: { montant: true },
    where: { date: { gte: debut, lte: fin }, ...(methode ? { methode } : {}) },
  });
  return r._sum.montant ?? ZERO;
}

export async function getRepartition(
  debut: Date,
  fin: Date,
): Promise<{ prive: Prisma.Decimal; collectif: Prisma.Decimal; pack: Prisma.Decimal }> {
  const periode = { gte: debut, lte: fin };
  const [prive, collectif, pack] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, participation: { seance: { type: "PRIVE" } } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, participation: { seance: { type: "COLLECTIF" } } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, packId: { not: null } },
    }),
  ]);
  return {
    prive: prive._sum.montant ?? ZERO,
    collectif: collectif._sum.montant ?? ZERO,
    pack: pack._sum.montant ?? ZERO,
  };
}

export async function getImpayes(): Promise<
  Array<{ eleveId: string; nom: string; total: Prisma.Decimal }>
> {
  const groupes = await prisma.participation.groupBy({
    by: ["eleveId"],
    where: { statutReglement: "A_REGLER" },
    _sum: { montant: true },
  });
  const eleveIds = groupes.map((g) => g.eleveId);
  const eleves = await prisma.eleve.findMany({
    where: { id: { in: eleveIds } },
    select: { id: true, prenom: true, nom: true },
  });
  const nomParId = new Map(eleves.map((e) => [e.id, `${e.prenom} ${e.nom}`]));

  return groupes
    .map((g) => ({
      eleveId: g.eleveId,
      nom: nomParId.get(g.eleveId) ?? "—",
      total: g._sum.montant ?? ZERO,
    }))
    .filter((x) => x.total.greaterThan(0))
    .sort((a, b) => b.total.comparedTo(a.total));
}
