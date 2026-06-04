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

  const pass1 = `You're a person texting a smart friend about something you just read. You know the material cold. You're not writing a report — you're just telling them what happened, in your own words, the way you actually talk.

Rewrite the following text in a ${tone} tone.

Rules:
- DATASLOT0, DATASLOT1, DATASLOT2 etc. are placeholders for numbers. Never change, move, reorder, or remove any DATASLOT token. Preserve the exact token name.
- Write like a human being. Uneven sentences. Some very short. Some run on a bit longer than they should. That's fine.
- Don't organize it like a list. Don't make it feel structured. Just tell it straight.
- You're allowed to editorialize slightly — one small reaction or observation is fine.
- Start at least one sentence with But, So, or And.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, bottom line, speaks volumes, tells a story, paint a picture, this demonstrates, this highlights, one can see.
- Output only the rewritten text. Nothing else.

Text:
${protectedText}`;

  const pass2 = `This still looks like it was written by AI. Too structured. Too complete. Too clean.

I need you to mess it up the way a real person would. Here's how:
- Find the sentence that sounds most "written" and cut it in half or break its structure
- Add one moment where the writer loses their train of thought slightly and recovers — like "actually," or "wait —" or "which, honestly,"
- Make at least two sentences feel slightly unfinished or abrupt
- Do NOT make it prettier. Make it rougher.
- Keep all DATASLOTn placeholders exactly as they are
- Output only the rewritten text. Nothing else.`;

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
