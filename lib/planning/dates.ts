export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay(); // 0 = dimanche, 1 = lundi, ...
  const diff = (day + 6) % 7; // nb de jours depuis lundi
  return addDays(r, -diff);
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function eachDayOfWeek(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Une séance répétée chaque semaine : setDate garde l'heure locale, même au
// changement d'heure (18:00 reste 18:00 après le passage à l'heure d'hiver).
export function datesRepetees(debut: Date, nbSemaines: number): Date[] {
  return Array.from({ length: nbSemaines }, (_, i) => addDays(debut, 7 * i));
}
