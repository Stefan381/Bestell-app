import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { orderStaffInclude } from "@/lib/orderInclude";
import { buildOrderWhere } from "@/lib/orderFilters";
import { DEPARTMENT_LABELS, type Department } from "@/lib/departments";

const STATUS_ORDER = ["OFFEN", "BESTELLT", "GELIEFERT"] as const;
const STATUS_SHEET_NAME: Record<(typeof STATUS_ORDER)[number], string> = {
  OFFEN: "Offen",
  BESTELLT: "Bestellt",
  GELIEFERT: "Geliefert",
};

function formatDateTime(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

const COLUMNS = [
  { header: "Vorgangsnr.", key: "orderNumber", width: 14 },
  { header: "Nachname", key: "lastName", width: 16 },
  { header: "Vorname", key: "firstName", width: 14 },
  { header: "Filiale", key: "filiale", width: 14 },
  { header: "Abteilung", key: "department", width: 14 },
  { header: "Artikel", key: "article", width: 28 },
  { header: "Menge", key: "quantity", width: 8 },
  { header: "Lieferant", key: "supplier", width: 20 },
  { header: "Hersteller", key: "manufacturer", width: 18 },
  { header: "EAN", key: "ean", width: 16 },
  { header: "Preis (€)", key: "price", width: 10 },
  { header: "Notiz", key: "note", width: 24 },
  { header: "Erfasst am", key: "createdAt", width: 16 },
  { header: "Erfasst von", key: "createdBy", width: 16 },
  { header: "Bestellt am", key: "orderedAt", width: 16 },
  { header: "Bestellt von", key: "orderedBy", width: 16 },
  { header: "Geliefert am", key: "deliveredAt", width: 16 },
  { header: "Geliefert von", key: "deliveredBy", width: 16 },
] as const;

// Excel exports of the dashboard tiles: one sheet per status (Offen/
// Bestellt/Geliefert) so they can be worked with separately, one row per
// order item (not per order) so a multi-item order's suppliers each get
// their own filterable row - important for compiling "Offen" orders per
// Lieferant. Respects the same filters currently set on the dashboard.
export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { searchParams } = new URL(request.url);
  const where = buildOrderWhere(searchParams);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: orderStaffInclude,
    take: 2000,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  for (const status of STATUS_ORDER) {
    const sheet = workbook.addWorksheet(STATUS_SHEET_NAME[status]);
    sheet.columns = COLUMNS.map(({ header, key, width }) => ({ header, key, width }));

    const ordersForStatus = orders.filter((o) => o.status === status);
    for (const order of ordersForStatus) {
      for (const item of order.items) {
        sheet.addRow({
          orderNumber: order.orderNumber,
          lastName: order.customer.lastName,
          firstName: order.customer.firstName ?? "",
          filiale: order.filiale.name,
          department: order.department ? DEPARTMENT_LABELS[order.department as Department] : "",
          article: item.article?.name ?? item.freeTextWish ?? "Artikel",
          quantity: item.quantity,
          supplier: item.article?.supplier ?? "",
          manufacturer: item.article?.manufacturer ?? "",
          ean: item.article?.ean ?? "",
          price: item.article ? Number(item.article.price) : "",
          note: order.note ?? "",
          createdAt: formatDateTime(order.createdAt),
          createdBy: order.createdByUser?.name ?? "Kunde (Kiosk)",
          orderedAt: formatDateTime(order.orderedAt),
          orderedBy: order.orderedByUser?.name ?? "",
          deliveredAt: formatDateTime(order.deliveredAt),
          deliveredBy: order.deliveredByUser?.name ?? "",
        });
      }
    }

    sheet.getRow(1).font = { bold: true };
    if (sheet.rowCount > 0) {
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bestellungen-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
