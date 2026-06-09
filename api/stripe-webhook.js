// api/stripe-webhook.js — Stripe webhook to update Supabase plan on payment

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_MAP = {
  "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j": "basic",
  "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k": "pro",
  "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l": "premium"
};

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
    const email = session.customer_details?.email;
    const paymentLink = session.payment_link;

    if (!email) {
      return res.status(400).json({ error: "No email found in session" });
    }

    // Match payment link to plan
    let plan = null;
    for (const [link, planName] of Object.entries(PLAN_MAP)) {
      if (paymentLink && link.includes(paymentLink)) {
        plan = planName;
        break;
      }
    }

    // Also check by amount as fallback
    if (!plan) {
      const amount = session.amount_total;
      if (amount === 900) plan = "basic";
      else if (amount === 1900) plan = "pro";
      else if (amount === 3900) plan = "premium";
    }

    if (!plan) {
      return res.status(400).json({ error: "Could not determine plan" });
    }

    // Find user by email and update their plan
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
      .update({ plan, rewrite_count: 0 })
      .eq("id", user.id);

    if (updateError) {
      return res.status(500).json({ error: "Could not update plan" });
    }

    console.log(`Updated ${email} to ${plan} plan`);
  }

  return res.status(200).json({ received: true });
}
