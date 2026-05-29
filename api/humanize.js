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
    /(\$\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?\s?%|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      protectedItems.push(match.trim());
      return `❌${protectedItems.length - 1}❌`;
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
1. Tokens wrapped in ❌ like ❌0❌ ❌1❌ ❌2❌ are protected values. Keep every one exactly as-is. Do not split, modify, or remove them under any circumstances.
2. Use contractions. Use dashes. Vary sentence length.
3. NEVER use: "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "showcasing", "highlighting", "underscoring", "no doubt about it", "here's where it gets interesting", "at least on the surface", "at least on paper", "the trajectory", "worth noting", "real momentum", "solid growth".
4. Output ONLY the rewritten text. Nothing else.

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

  // Restore numbers immediately
  let restored = claudeOutput.replace(/❌(\d+)❌/g, (match, index) => {
    return protectedItems[parseInt(index, 10)] !== undefined
      ? protectedItems[parseInt(index, 10)]
      : match;
  });

  // Synonym swap pass
  const synonyms = {
    "remains the core driver": ["still leads the way", "keeps driving results", "is still out front"],
    "remains": ["is still", "continues as", "stays"],
    "surpassing": ["beating", "topping", "clearing"],
    "allocated": ["put", "spent", "directed"],
    "materializes": ["plays out", "comes through", "holds"],
    "projecting": ["expecting", "forecasting", "calling for"],
    "translating to": ["giving them", "working out to", "meaning"],
    "generating": ["bringing in", "pulling in", "producing"],
    "accounting for": ["making up", "representing", "covering"],
    "segment": ["side", "division", "part of the business"],
    "rewarded": ["taken care of", "paid back", "returned value"],
    "paints a picture of": ["shows", "points to", "suggests"],
    "demonstrates": ["shows", "points to", "reflects"],
    "reliable expansion": ["continued growth", "steady gains", "consistent progress"],
    "reliable growth": ["continued growth", "steady gains", "consistent progress"],
  };

  Object.keys(synonyms).forEach((phrase) => {
    const options = synonyms[phrase];
    const replacement = options[Math.floor(Math.random() * options.length)];
    const regex = new RegExp(phrase, "gi");
    restored = restored.replace(regex, replacement);
  });

  // Light cleanup
  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
}
