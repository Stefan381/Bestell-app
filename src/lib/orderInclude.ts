/** Shared include shape for Order queries. User relations are deliberately
 * narrowed with `select` (never `include: true`) so passwordHash and other
 * account fields never leave the API — see the credential leak this fixed. */
export const orderStaffInclude = {
  customer: true,
  filiale: true,
  items: { include: { article: true } },
  createdByUser: { select: { id: true, name: true } },
  orderedByUser: { select: { id: true, name: true } },
  deliveredByUser: { select: { id: true, name: true } },
} as const;
