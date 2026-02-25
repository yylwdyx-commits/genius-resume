import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.payment_succeeded": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const subId: string | undefined =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
      const customerId: string | undefined =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (subId && customerId) {
        const subscription = await getStripe().subscriptions.retrieve(subId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = new Date((subscription as any).current_period_end * 1000);
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "pro", stripeSubId: subId, planExpiry: periodEnd },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "free", stripeSubId: null, planExpiry: null },
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (sub.status !== "active" && sub.status !== "trialing") {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "free", stripeSubId: null, planExpiry: null },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
