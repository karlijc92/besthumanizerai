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

  const personas = [
    "a tired grad student writing up findings at midnight",
    "a sharp financial analyst who writes like they talk",
    "a business journalist on deadline who keeps it punchy",
    "a senior consultant who's seen it all and writes plainly",
    "a detail-oriented accountant who explains numbers clearly"
  ];
  const persona = personas[Math.floor(Math.random() * personas.length)];

  const prompt = `You are ${persona}. Rewrite the text below in your own natural voice.

${toneInstruction}

RULES:
1. Tokens like NUM0X, NUM1X, NUM2X are protected values. Keep every single one exactly as-is. Do not change, move, or remove them.
2. Write exactly how that person would write — their vocabulary, their rhythm, their personality.
3. Vary sentence length. Some short. Some longer and more detailed.
4. Use contractions naturally. Use dashes, parentheses, real punctuation.
5. Never use: "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "showcasing", "highlighting", "underscoring", "it is worth noting".
6. Do not add new facts or numbers.
7. Output ONLY the rewritten text. No preamble, no explanation.

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
