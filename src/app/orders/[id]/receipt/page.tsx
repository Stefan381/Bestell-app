import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { orderStaffInclude } from "@/lib/orderInclude";
import { customerFullName } from "@/lib/customerName";
import { DEPARTMENT_LABELS, type Department } from "@/lib/departments";
import { PrintButton } from "./PrintButton";

// Google review link for City Kauf GmbH, encoded as a QR code below.
const REVIEW_URL = "https://g.page/r/Ce8ZS0ybjkgTEBM/review";

function formatDateTime(value: Date | null): string {
  if (!value) return "–";
  // The server (Vercel) runs in UTC, not the shop's local time - printed
  // receipts need to always show Berlin time regardless of where the app
  // happens to be hosted.
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

// Deliberately outside the (staff) route group: a print page shouldn't carry
// the staff nav header, so it only inherits the root layout (fonts/theme).
// Session-checked by hand here since it doesn't get that protection from
// (staff)/layout.tsx - see also the /orders/:path* proxy.ts matcher.
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderStaffInclude,
  });

  if (!order) {
    return <div className="p-8 text-center text-foreground/60">Bestellung nicht gefunden.</div>;
  }

  const total = order.items.reduce(
    (sum, item) => sum + (item.article ? Number(item.article.price) * item.quantity : 0),
    0
  );

  const reviewQrSvg = await QRCode.toString(REVIEW_URL, { type: "svg", margin: 0, width: 120 });

  return (
    <div className="mx-auto max-w-md p-8 text-sm text-foreground print:p-0">
      <PrintButton />

      <div className="text-center">
        <h1 className="text-lg font-semibold">City Kauf GmbH</h1>
        <p className="text-foreground/60">{order.filiale.name}</p>
        {order.filiale.address && <p className="text-xs text-foreground/50">{order.filiale.address}</p>}
      </div>

      <h2 className="mt-6 text-center text-base font-semibold">Liefer-Quittung</h2>
      <p className="text-center text-foreground/60">
        Vorgangsnr. <span className="font-mono">{order.orderNumber}</span>
      </p>

      <div className="mt-4 space-y-0.5 border-t border-dashed border-border pt-3">
        <p>Kunde: {customerFullName(order.customer)}</p>
        {order.department && <p>Abteilung: {DEPARTMENT_LABELS[order.department as Department]}</p>}
        <p>Datum: {formatDateTime(order.deliveredAt ?? order.createdAt)}</p>
      </div>

      <table className="mt-4 w-full border-t border-dashed border-border pt-3 text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase text-foreground/50">
            <th className="py-1">Artikel</th>
            <th className="py-1 pl-4 text-right">Menge</th>
            <th className="py-1 pl-4 text-right">Preis</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-border/50">
              <td className="py-1">{item.article?.name ?? item.freeTextWish ?? "Artikel"}</td>
              <td className="py-1 pl-4 text-right">{item.quantity}</td>
              <td className="py-1 pl-4 text-right whitespace-nowrap">
                {item.article ? `${(Number(item.article.price) * item.quantity).toFixed(2)} €` : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex justify-between font-semibold">
        <span>Gesamt</span>
        <span>{total.toFixed(2)} €</span>
      </div>

      {order.note && <p className="mt-4 text-xs text-foreground/60">Notiz: {order.note}</p>}

      <p className="mt-8 text-center text-xs text-foreground/60">
        Danke für Deine Bestellung. Wenn Du mit uns zufrieden bist, dann würden wir uns über Deine 5 Sterne
        Bewertung freuen.
      </p>
      <div
        className="mx-auto mt-3 h-[120px] w-[120px]"
        dangerouslySetInnerHTML={{ __html: reviewQrSvg }}
      />
    </div>
  );
}
