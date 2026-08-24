import { prisma } from "@/lib/prisma";
import { UsersManager } from "./UsersManager";

export default async function UsersSettingsPage() {
  const [users, filialen] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, isActive: true, filialeId: true, filiale: true },
    }),
    prisma.filiale.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <UsersManager initialUsers={users} filialen={filialen} />;
}
