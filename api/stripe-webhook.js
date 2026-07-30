// api/stripe-webhook.js — Stripe webhook to update Supabase plan on payment/cancellation
// NOTE: This Stripe account is shared across all 4 businesses, so this endpoint
// receives events for ALL of them. We filter to only act on BestHumanizerAI events.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export const config = {
  api: { bodyParser: false }
};
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(Buffer.from(data)));
    req.on("error", reject);
  });
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: "Webhook error: " + err.message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Filter: only act on events belonging to BestHumanizerAI.
    // Other businesses on this same Stripe account will fire this event too.
    const successUrl = session.success_url || "";
    if (!successUrl.includes("besthumanizerai.com")) {
      console.log(`Ignoring checkout event not for BestHumanizerAI: ${successUrl}`);
      return res.status(200).json({ received: true, ignored: true });
    }

    const email = session.customer_details?.email;
    if (!email) {
      return res.status(400).json({ error: "No email found in session" });
    }
    const amount = session.amount_total;
    let plan = null;
    if (amount === 900) plan = "basic";
    else if (amount === 1900) plan = "pro";
    else if (amount === 3900) plan = "premium";
    if (!plan) {
      console.error(`Could not determine plan for amount: ${amount}`);
      return res.status(400).json({ error: "Could not determine plan" });
    }
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      return res.status(500).json({ error: "Could not fetch users" });
    }
    const user = users.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: "User not found for email: " + email });
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan, rewrite_count: 0, stripe_customer_id: session.customer })
      .eq("id", user.id);
    if (updateError) {
      return res.status(500).json({ error: "Could not update plan" });
    }
    console.log(`Updated ${email} to ${plan} plan`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const { error: downgradeError } = await supabase
      .from("profiles")
      .update({ plan: "free", rewrite_count: 0 })
      .eq("stripe_customer_id", customerId);
    if (downgradeError) {
      console.error(`Could not downgrade customer ${customerId}:`, downgradeError.message);
      return res.status(500).json({ error: "Could not downgrade plan" });
    }
    console.log(`Downgraded customer ${customerId} to free plan (subscription deleted)`);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const badStatuses = ["canceled", "unpaid", "past_due", "incomplete_expired"];
    if (badStatuses.includes(subscription.status)) {
      const { error: downgradeError } = await supabase
        .from("profiles")
        .update({ plan: "free", rewrite_count: 0 })
        .eq("stripe_customer_id", customerId);
      if (downgradeError) {
        console.error(`Could not downgrade customer ${customerId}:`, downgradeError.message);
        return res.status(500).json({ error: "Could not downgrade plan" });
      }
      console.log(`Downgraded customer ${customerId} to free plan (status: ${subscription.status})`);
    }
  }

  return res.status(200).json({ received: true });
}
