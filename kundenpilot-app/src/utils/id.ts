let counter = 0;

/** Kurze, kollisionsarme ID ohne externe Abhängigkeit (reicht für Mock-Daten/Client-State). */
export function createId(prefix: string): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${random}`;
}
