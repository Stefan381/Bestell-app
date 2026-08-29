/** Vorname is optional, so every "Vorname Nachname" display needs to fall
 * back gracefully when it's missing instead of leaving a stray space. */
export function customerFullName(customer: { firstName: string | null; lastName: string }): string {
  return customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.lastName;
}

/** Same, "Nachname, Vorname" order - used by the compact dashboard tiles. */
export function customerFullNameReversed(customer: { firstName: string | null; lastName: string }): string {
  return customer.firstName ? `${customer.lastName}, ${customer.firstName}` : customer.lastName;
}
