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

/** Shared include for the notification history shown on an order card -
 * enough rows to show the latest per channel, with who clicked "informieren". */
export const orderNotificationsInclude = {
  orderBy: { createdAt: "desc" as const },
  take: 20,
  include: { sentByUser: { select: { id: true, name: true } } },
} as const;
