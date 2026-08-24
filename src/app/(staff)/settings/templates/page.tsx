import { prisma } from "@/lib/prisma";
import { TemplatesManager } from "./TemplatesManager";

export default async function TemplatesSettingsPage() {
  const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: "asc" } });
  return <TemplatesManager initialTemplates={templates} />;
}
