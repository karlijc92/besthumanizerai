module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  // ── PROTECTION: named slots instead of sequential DATASLOT ──────────────
  const slotMap = {};
  let slotCounter = 0;
  const protectedText = text.replace(
    /(\$\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?\s?%|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      const key = `DATASLOT${slotCounter++}`;
      slotMap[key] = match.trim();
      return key;
    }
  );
  // ────────────────────────────────────────────────────────────────────────

  const toneMap = {
    "data-safe": "natural and conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented",
    "plain": "simple plain English",
  };

  const tone = toneMap[mode] || toneMap["data-safe"];

  const pass1 = `You are a blunt, experienced financial journalist. You write how you think — fast, direct, no filler. You use short sentences when they land harder. You use fragments on purpose. You use dashes where a comma feels too stiff. You never over-explain.

Rewrite the following text in a ${tone} tone.

Rules you must follow:
- DATASLOT0, DATASLOT1, DATASLOT2 etc. are placeholders for numbers and citations. Never change, move, reorder, or remove any DATASLOT token. Each one has a unique number — preserve the exact token name.
- Mix sentence lengths. Some short. Some longer. Never three in a row the same length.
- Use at least one fragment or one sentence starting with And, But, or So.
- Use a dash instead of a comma at least once where it feels natural.
- Do not change the order of the information.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, bottom line, speaks volumes, tells a story, paint a picture, firing on all cylinders, real momentum, solid growth, it is worth noting, one can see, this demonstrates, this highlights.
- Output only the rewritten text. Nothing else.

Text:
${protectedText}`;

  const pass2 = `Read this again. Find any sentence that still sounds like it was generated — too smooth, too balanced, too complete. Break it. Shorten it. Cut a word. Make it sound like a person who knows this stuff and doesn't need to prove it. Keep all DATASLOTn placeholders exactly as they are. Output only the rewritten text.`;

  let finalOutput;
  try {
    const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: pass1 }],
      }),
    });

    const data1 = await res1.json();
    if (!res1.ok) return res.status(500).json({ error: "Claude API error on pass 1", detail: data1 });
    const pass1Output = data1.content[0].text;

    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          { role: "user", content: pass1 },
          { role: "assistant", content: pass1Output },
          { role: "user", content: pass2 },
        ],
      }),
    });

    const data2 = await res2.json();
    if (!res2.ok) return res.status(500).json({ error: "Claude API error on pass 2", detail: data2 });
    finalOutput = data2.content[0].text;

  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Claude API", detail: err.message });
  }

  // ── RESTORATION: each named slot restores to its exact original value ────
  let restored = finalOutput.replace(/DATASLOT\d+/g, (match) => {
    return slotMap[match] !== undefined ? slotMap[match] : match;
  });
  // ────────────────────────────────────────────────────────────────────────

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
