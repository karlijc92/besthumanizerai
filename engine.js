// engine.js — BestHumanizerAI

async function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  try {
    const response = await fetch("/api/humanize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return "Error: " + (err.error || "Something went wrong. Please try again.");
    }

    const data = await response.json();
    return data.result || text;

  } catch (e) {
    console.error("Fetch error:", e);
    return "Connection error. Please try again.";
  }
}
