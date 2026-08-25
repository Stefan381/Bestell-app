import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { NotificationRenderError, logOrderNotification, renderOrderNotification } from "@/lib/notifications";

const schema = z.object({ channel: z.enum(["EMAIL", "WHATSAPP"]) });

/** Renders the order-ready message for one channel, logs that this staff
 * member notified the customer, and returns the content so the client can
 * open a prefilled mailto:/wa.me link. See src/lib/notifications/index.ts -
 * this app never sends anything itself. */
export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/notify">) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const rendered = await renderOrderNotification(id, parsed.data.channel);
    await logOrderNotification({
      orderId: id,
      channel: parsed.data.channel,
      recipient: rendered.recipient,
      body: rendered.body,
      templateId: rendered.templateId,
      sentByUserId: auth.session.userId,
    });
    return NextResponse.json(rendered);
  } catch (error) {
    if (error instanceof NotificationRenderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
