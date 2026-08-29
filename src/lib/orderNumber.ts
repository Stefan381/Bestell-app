import { prisma } from "@/lib/prisma";

const MIN = 100_000;
const MAX = 999_999;

function randomOrderNumber(): string {
  return String(Math.floor(Math.random() * (MAX - MIN + 1)) + MIN);
}

/** Generates a random 6-digit "Vorgangsnummer" for a new order, retrying on
 * the (extremely unlikely, ~1 in 900,000) chance of colliding with an
 * existing one. This is a human-readable reference customers/staff can read
 * out loud - separate from the internal cuid `Order.id`. */
export async function generateUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomOrderNumber();
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Konnte keine eindeutige Vorgangsnummer erzeugen.");
}
