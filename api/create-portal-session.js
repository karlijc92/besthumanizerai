// api/create-portal-session.js — generates a Stripe billing portal link for the logged-in user
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.stripe_customer_id) {
    return res.status(404).json({ error: "No billing account found for this user" });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: "https://www.besthumanizerai.com/account.html",
    });
    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal session error:", err.message);
    return res.status(500).json({ error: "Could not create billing portal session" });
  }
}
