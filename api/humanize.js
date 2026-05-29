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
    "data-safe": "natural, conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented resume",
    "plain": "simple plain English",
  };

  const tone = modeInstructions[mode] || modeInstructions["data-safe"];

  const prompt = `You are a human writer. Rewrite the text below in a ${tone} tone.

RULES:
1. Tokens like NUM0X, NUM1X, NUM2X are protected. Keep every one exactly as-is.
2. Use contractions. Use dashes. Use parentheses.
3. Vary sentence length — some very short, some longer.
4. NEVER use these phrases under any circumstances: "no doubt about it", "here's where it gets interesting", "but here's the thing", "at least on the surface", "at least on paper", "the trajectory", "pointing upward", "heading in the right direction", "worth noting", "it's worth", "real momentum", "real growth", "solid growth", "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "showcasing", "highlighting", "underscoring".
5. Do not use filler transition phrases. Just say the thing directly.
6. Output ONLY the rewritten text. Nothing else.

Text:
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
    if (!response.ok) return res.status(500).json({ error: "Claude API error" });
    claudeOutput = data.content[0].text;
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Claude API" });
  }

  // Restore protected values
  let restored = claudeOutput.replace(/NUM(\d+)X/g, (match, index) => {
    return protectedItems[parseInt(index, 10)] !== undefined
      ? protectedItems[parseInt(index, 10)]
      : match;
  });

  // Light cleanup only — no aggressive replacements that corrupt sentences
  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])([A-Za-z])/g, "$1 $2")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
}
