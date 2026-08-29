import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BatchActionSheet } from '@/components/admin/BatchActionSheet';
import { CustomerRow } from '@/components/admin/CustomerRow';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { useCustomerStore } from '@/state/customerStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { daysBetween } from '@/utils/date';

type ActivityFilter = 'all' | 'active' | 'inactive_30' | 'inactive_60' | 'inactive_90';

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'active', label: 'Aktiv' },
  { key: 'inactive_30', label: 'Inaktiv ≥30 T.' },
  { key: 'inactive_60', label: 'Inaktiv ≥60 T.' },
  { key: 'inactive_90', label: 'Inaktiv ≥90 T.' },
];

export default function CustomersListScreen() {
  const customers = useCustomerStore((s) => s.customers);
  const accounts = useLoyaltyStore((s) => s.accounts);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => {
        if (!q) return true;
        return (
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.customerNumber.toLowerCase().includes(q)
        );
      })
      .filter((c) => {
        const inactiveDays = c.lastPurchaseAt ? daysBetween(c.lastPurchaseAt) : Number.POSITIVE_INFINITY;
        switch (filter) {
          case 'active':
            return inactiveDays < 30;
          case 'inactive_30':
            return inactiveDays >= 30;
          case 'inactive_60':
            return inactiveDays >= 60;
          case 'inactive_90':
            return inactiveDays >= 90;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const at = a.lastPurchaseAt ? new Date(a.lastPurchaseAt).getTime() : 0;
        const bt = b.lastPurchaseAt ? new Date(b.lastPurchaseAt).getTime() : 0;
        return bt - at;
      });
  }, [customers, query, filter]);

  const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));

  function toggleSelect(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return (
    <Screen contentClassName="pb-24">
      <SectionHeader title={`Kund:innen (${filtered.length})`} />
      <TextField
        placeholder="Suche nach Name, E-Mail, Kundennummer…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            label={f.label}
            size="sm"
            variant={filter === f.key ? 'primary' : 'secondary'}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {selectedIds.length > 0 ? (
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm text-ink-500 dark:text-ink-300">
            {selectedIds.length} ausgewählt
          </Text>
          <Button label="Auswahl aufheben" size="sm" variant="ghost" onPress={() => setSelectedIds([])} />
          <Button
            label="Kontaktieren"
            size="sm"
            icon={<Ionicons name="send" size={14} color="white" />}
            onPress={() => setSheetOpen(true)}
          />
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="Keine Treffer" message="Passe Suche oder Filter an." />
      ) : (
        <View className="gap-2">
          {filtered.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              pointsBalance={accounts[customer.id]?.pointsBalance ?? 0}
              selected={selectedIds.includes(customer.id)}
              onToggleSelect={() => toggleSelect(customer.id)}
              onPress={() => router.push({ pathname: '/(admin)/customers/[id]', params: { id: customer.id } })}
            />
          ))}
        </View>
      )}

      <BatchActionSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} customers={selectedCustomers} />
    </Screen>
  );
}
