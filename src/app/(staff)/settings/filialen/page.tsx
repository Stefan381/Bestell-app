import { prisma } from "@/lib/prisma";
import { FilialenManager } from "./FilialenManager";

export default async function FilialenSettingsPage() {
  const filialen = await prisma.filiale.findMany({ orderBy: { name: "asc" } });
  return <FilialenManager initialFilialen={filialen} />;
}
