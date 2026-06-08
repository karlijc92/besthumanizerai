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

  const pass1 = `You are a human writer rewriting your own draft. You are tired, slightly frustrated, and writing fast. You do not write like an AI.

Rewrite the following text in a ${tone} tone.

HARD RULES — break any of these and the output is rejected:
- [[NUMSLOT_0]], [[NUMSLOT_1]], [[NUMSLOT_2]] etc are locked placeholders. Copy them exactly. Never alter, split, move, or remove any [[NUMSLOT_N]] token.
- Mix sentence lengths violently. One word. Maybe two. Then a longer one that runs a bit. Then short again. Never three sentences the same length in a row.
- Use contractions naturally — don't, it's, they're, wasn't — wherever a human would.
- At least one sentence must be an incomplete fragment. Just a phrase. No verb.
- At least one sentence must start with "And" or "But" or "So" — like a real person mid-thought.
- Use a dash to interrupt at least one thought — mid-sentence — like this.
- At least one sentence must feel like an afterthought added at the end.
- Vary how sentences start — never two in a row starting with the same word or structure.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, this demonstrates, this highlights, one can see, it is clear, it is evident, in summary, overall, as a result of this, it should be noted, this suggests, this indicates, it can be seen.
- Do not write neat tidy conclusions. Real writers leave things a little open.
- Output ONLY the rewritten text. No intro, no label, no explanation.

Text:
${text}`;

  const pass2 = `You are a human editor whose only job is to make sure this text does not get flagged by AI detectors like GPTZero or Originality.ai.

AI detectors flag text that has: uniform sentence rhythm, smooth transitions, clean conclusions, parallel structure, and predictable word choices.

Go through every sentence and do the following:

1. Find any two sentences with similar length or rhythm — rewrite one to be jarringly different
2. Find any sentence that ends cleanly and neatly — cut the last few words, or add a messy qualifier after
3. Find any transition word (however, therefore, additionally, consequently, furthermore) — delete it or replace with something blunter
4. Find the most "AI-sounding" sentence — the smoothest, most confident one — and make it rougher, less certain, more human
5. Add one sentence somewhere in the middle that feels slightly off-topic or like a second thought a human would throw in
6. Make sure at least two sentences start with lowercase connector words naturally used mid-paragraph by humans (and, but, so)
7. Intentionally vary punctuation — use a dash somewhere, leave one sentence without a tidy ending

CRITICAL: Keep all [[NUMSLOT_N]] placeholders exactly as they appear. Do not alter them in any way.

Output ONLY the final text. No explanation. No label. Nothing else.`;

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

  let restored = finalOutput;

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
