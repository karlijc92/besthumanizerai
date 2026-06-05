module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const toneMap = {
    "data-safe": "natural and conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented",
    "plain": "simple plain English",
  };

  const tone = toneMap[mode] || toneMap["data-safe"];

  const pass1 = `You are a tired grad student rewriting your own notes at 11pm. Not polished. Not structured. Just real.

Rewrite the following text in a ${tone} tone.

Rules:
- [[NUMSLOT_0]], [[NUMSLOT_1]], [[NUMSLOT_2]] etc are locked placeholders. Copy them exactly as-is. Never alter, move, split, or remove any [[NUMSLOT_N]] token.
- Vary sentence length aggressively. One word. Three words. Twelve. Never the same length twice in a row.
- Drop filler words a real person would drop. Write lean.
- At least two sentences must be fragments — no verb, just a phrase.
- At least one sentence must start mid-thought as if continuing something unsaid.
- Use dashes to interrupt thoughts — like this — at least once.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, this demonstrates, this highlights, one can see, it is clear, it is evident, in summary, overall, as a result of this, it should be noted.
- No two consecutive sentences can have similar grammatical structure.
- Output only the rewritten text. No intro. No explanation. No formatting.

Text:
${text}`;

  const pass2 = `You are an AI detection expert. Your job is to make this text fail every AI detector.

Read each sentence. Ask yourself: does this sound like it was generated? If yes — destroy the pattern.

Rules:
- Sentences over 12 words that flow too smoothly: cut them in half or stab a dash in the middle
- Any two sentences with parallel structure: rewrite one completely
- Any sentence that ends on a neat conclusion: cut the last few words or trail off
- Add at least one sentence that feels like a second thought — like the writer added it after
- Make the rhythm feel accidental, not designed
- Keep all [[NUMSLOT_N]] placeholders exactly as they appear — do not alter them in any way
- Output only the final text. Nothing else. No explanation.`;

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

  // Restore any leftover [[NUMSLOT_N]] that survived (safety net only — protect.js handles primary restoration)
  let restored = finalOutput;

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
