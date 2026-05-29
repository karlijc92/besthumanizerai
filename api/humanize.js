export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const protectedItems = [];
  const protectedText = text.replace(
    /(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?%?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      protectedItems.push(match);
      return `NUM${protectedItems.length - 1}X`;
    }
  );

  const modeInstructions = {
    "data-safe": "Rewrite this in a natural, conversational but professional tone.",
    "academic": "Rewrite this in a formal academic tone suitable for a research paper or thesis.",
    "business": "Rewrite this in a professional business report tone.",
    "executive": "Rewrite this as a concise executive summary with confident, direct language.",
    "resume": "Rewrite this in a strong, action-oriented resume/cover letter tone.",
    "plain": "Rewrite this in simple plain English that anyone can understand.",
  };

  const toneInstruction = modeInstructions[mode] || modeInstructions["data-safe"];

  const prompt = `You are a college-educated human writer editing a report. Rewrite the text below so it reads exactly like a real person wrote it — not an AI.

${toneInstruction}

RULES:
1. Tokens like NUM0X, NUM1X, NUM2X are protected values. Keep every single one exactly as-is. Do not change, move, or remove them.
2. Write like a real human: use contractions (it's, they've, that's), occasional sentence fragments, and natural filler phrases like "for context", "to be fair", "worth noting", "at least on paper".
3. Vary sentence length dramatically — some sentences should be very short. One or two words even.
4. Use dashes, parentheses, and informal asides the way a real writer would.
5. Avoid these AI words entirely: "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "it is worth noting", "showcasing", "highlighting", "underscoring".
6. Occasionally start a sentence with "And" or "But" — real writers do this.
7. Do not add new facts or numbers.
8. Output ONLY the rewritten text. No preamble, no explanation.

Text to rewrite:
${protectedText}`;

  let claudeOutput;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", data);
      return res.status(500).json({ error: "Claude API error", detail: data });
    }

    claudeOutput = data.content[0].text;
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: "Failed to reach Claude API" });
  }

  let restored = claudeOutput.replace(/NUM(\d+)X/g, (match, index) => {
    return protectedItems[parseInt(index, 10)] !== undefined
      ? protectedItems[parseInt(index, 10)]
      : match;
  });

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])([A-Za-z])/g, "$1 $2")
    .replace(/(%)([A-Za-z])/g, "$1 $2")
    .trim();

  return res.status(200).json({ result: restored });
}
