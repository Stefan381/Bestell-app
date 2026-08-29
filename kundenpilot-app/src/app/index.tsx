import { Redirect } from 'expo-router';

import { useAuthStore } from '@/state/authStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.role === 'admin') return <Redirect href="/(admin)" />;
  return <Redirect href="/(customer)" />;
}
