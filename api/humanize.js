module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

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

  const toneMap = {
    "data-safe": "natural and conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented",
    "plain": "simple plain English",
  };

  const tone = toneMap[mode] || toneMap["data-safe"];

  const pass1 = `You are a person typing notes to yourself after reading an earnings report. Not a summary — just your running thoughts as you go through it. You skip words sometimes. You don't finish every thought perfectly. You react as you go.

Rewrite the following text in a ${tone} tone.

Rules:
- DATASLOT0, DATASLOT1, DATASLOT2 etc. are placeholders for numbers. Never change, move, reorder, or remove any DATASLOT token. Preserve the exact token name.
- Sentence lengths must vary wildly. Some one word. Some four words. Occasionally one longer one. Never two the same length back to back.
- Drop words that a real person would drop. "Net cash at DATASLOT" not "the net cash position sits at DATASLOT".
- No sentence should feel like it was crafted. They should feel typed.
- At least one sentence should be a pure fragment.
- At least one sentence should start mid-thought, like you're continuing something.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, bottom line, speaks volumes, tells a story, paint a picture, this demonstrates, this highlights, one can see, it is clear, it is evident.
- Output only the rewritten text. Nothing else.

Text:
${protectedText}`;

  const pass2 = `Read every sentence. For each one ask: could an AI have written this? If yes — break it.

Specifically:
- Any sentence longer than 15 words that flows smoothly: cut it or interrupt it with a dash mid-thought
- Any two consecutive sentences with similar structure: change one of them completely
- Any sentence that ends too neatly: cut the last few words off or add a fragment after it
- Scatter the rhythm so no two adjacent sentences feel related in length or structure
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

  let restored = finalOutput.replace(/DATASLOT\d+/g, (match) => {
    return slotMap[match] !== undefined ? slotMap[match] : match;
  });

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
