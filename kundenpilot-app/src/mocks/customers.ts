import type { Customer } from '@/types';
import { daysAgo } from '@/utils/date';

interface SeedCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastPurchaseDaysAgo: number | null;
  createdDaysAgo: number;
  consent: boolean;
  tags: string[];
  notes?: string;
}

const SEED: SeedCustomer[] = [
  { firstName: 'Anna', lastName: 'Bauer', email: 'anna.bauer@example.com', phone: '+491511234001', lastPurchaseDaysAgo: 2, createdDaysAgo: 400, consent: true, tags: ['Stammkundin'] },
  { firstName: 'Max', lastName: 'Wagner', email: 'max.wagner@example.com', phone: '+491511234002', lastPurchaseDaysAgo: 5, createdDaysAgo: 250, consent: true, tags: [] },
  { firstName: 'Sophie', lastName: 'Fischer', email: 'sophie.fischer@example.com', phone: '+491511234003', lastPurchaseDaysAgo: 45, createdDaysAgo: 500, consent: true, tags: ['Inaktiv'], notes: 'Bevorzugt Bio-Produkte.' },
  { firstName: 'Paul', lastName: 'Weber', email: 'paul.weber@example.com', phone: '+491511234004', lastPurchaseDaysAgo: 60, createdDaysAgo: 620, consent: false, tags: ['Inaktiv'] },
  { firstName: 'Mia', lastName: 'Schulz', email: 'mia.schulz@example.com', phone: '+491511234005', lastPurchaseDaysAgo: 1, createdDaysAgo: 30, consent: true, tags: ['Neukundin'] },
  { firstName: 'Leon', lastName: 'Hofmann', email: 'leon.hofmann@example.com', phone: '+491511234006', lastPurchaseDaysAgo: 14, createdDaysAgo: 200, consent: true, tags: [] },
  { firstName: 'Emma', lastName: 'Koch', email: 'emma.koch@example.com', phone: '+491511234007', lastPurchaseDaysAgo: 90, createdDaysAgo: 700, consent: true, tags: ['Inaktiv'], notes: 'Hat sich über lange Wartezeiten an der Kasse beschwert (03/2026).' },
  { firstName: 'Ben', lastName: 'Richter', email: 'ben.richter@example.com', phone: '+491511234008', lastPurchaseDaysAgo: 3, createdDaysAgo: 150, consent: true, tags: ['Stammkunde'] },
  { firstName: 'Lena', lastName: 'Klein', email: 'lena.klein@example.com', phone: '+491511234009', lastPurchaseDaysAgo: 35, createdDaysAgo: 300, consent: true, tags: ['Inaktiv'] },
  { firstName: 'Finn', lastName: 'Wolf', email: 'finn.wolf@example.com', phone: '+491511234010', lastPurchaseDaysAgo: 7, createdDaysAgo: 90, consent: false, tags: [] },
  { firstName: 'Laura', lastName: 'Neumann', email: 'laura.neumann@example.com', phone: '+491511234011', lastPurchaseDaysAgo: 0, createdDaysAgo: 5, consent: true, tags: ['Neukundin'] },
  { firstName: 'Tim', lastName: 'Schwarz', email: 'tim.schwarz@example.com', phone: '+491511234012', lastPurchaseDaysAgo: 120, createdDaysAgo: 900, consent: true, tags: ['Inaktiv'], notes: 'Zieht laut eigener Aussage bald weg.' },
  { firstName: 'Hannah', lastName: 'Zimmermann', email: 'hannah.zimmermann@example.com', phone: '+491511234013', lastPurchaseDaysAgo: 9, createdDaysAgo: 180, consent: true, tags: [] },
  { firstName: 'Jonas', lastName: 'Braun', email: 'jonas.braun@example.com', phone: '+491511234014', lastPurchaseDaysAgo: 4, createdDaysAgo: 60, consent: true, tags: [] },
  { firstName: 'Marie', lastName: 'Krüger', email: 'marie.krueger@example.com', phone: '+491511234015', lastPurchaseDaysAgo: 55, createdDaysAgo: 400, consent: false, tags: ['Inaktiv'] },
  { firstName: 'Noah', lastName: 'Hartmann', email: 'noah.hartmann@example.com', phone: '+491511234016', lastPurchaseDaysAgo: null, createdDaysAgo: 2, consent: true, tags: ['Neukundin'], notes: 'Registriert, aber noch kein Einkauf erfasst.' },
  { firstName: 'Lea', lastName: 'Lange', email: 'lea.lange@example.com', phone: '+491511234017', lastPurchaseDaysAgo: 18, createdDaysAgo: 220, consent: true, tags: [] },
  { firstName: 'Elias', lastName: 'Schmitt', email: 'elias.schmitt@example.com', phone: '+491511234018', lastPurchaseDaysAgo: 6, createdDaysAgo: 130, consent: true, tags: ['Stammkunde'] },
];

export const MOCK_CUSTOMERS: Customer[] = SEED.map((seed, index) => {
  const id = `cus_${String(index + 1).padStart(3, '0')}`;
  return {
    id,
    customerNumber: `CK-${100000 + index}`,
    firstName: seed.firstName,
    lastName: seed.lastName,
    email: seed.email,
    phone: seed.phone,
    address: {
      street: `Musterstraße ${index + 1}`,
      zip: '12345',
      city: 'Musterstadt',
    },
    notes: seed.notes,
    gdprMarketingConsent: seed.consent,
    createdAt: daysAgo(seed.createdDaysAgo),
    lastPurchaseAt: seed.lastPurchaseDaysAgo === null ? null : daysAgo(seed.lastPurchaseDaysAgo),
    hubspotContactId: index % 3 === 0 ? `hs_contact_${1000 + index}` : undefined,
    tags: seed.tags,
  };
});

// Demo-Login: diese Kundin ist in der Kunden-App bereits "eingeloggt".
export const DEMO_CUSTOMER_ID = MOCK_CUSTOMERS[0].id;
