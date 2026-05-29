module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  // Step 1: Extract numbers and replace with BLANK
  const protectedItems = [];
  const protectedText = text.replace(
    /(\$\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?\s?%|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      protectedItems.push(match.trim());
      return "DATASLOT";
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
1. The word DATASLOT is a placeholder for a number, percentage, date, or citation. Keep every DATASLOT exactly as the word DATASLOT — do not replace it, remove it, or change it in any way.
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

  // Step 2: Restore numbers in order by replacing each DATASLOT one at a time
  let slotIndex = 0;
  let restored = claudeOutput.replace(/DATASLOT/g, () => {
    const value = protectedItems[slotIndex];
    slotIndex++;
    return value !== undefined ? value : "DATASLOT";
  });

  // Step 3: Synonym swap
  const synonyms = {
    "remains the core driver": ["still leads the way", "keeps driving results", "is still out front"],
    "surpassing": ["beating", "topping", "clearing"],
    "allocated": ["put", "spent", "directed"],
    "materializes": ["plays out", "comes through", "holds"],
    "projecting": ["expecting", "forecasting", "calling for"],
    "translating to": ["giving them", "working out to", "meaning"],
    "generating": ["bringing in", "pulling in", "producing"],
    "accounting for": ["making up", "representing", "covering"],
    "demonstrates": ["shows", "points to", "reflects"],
    "reliable growth": ["continued growth", "steady gains", "consistent progress"],
    "dependable growth": ["continued growth", "steady gains", "consistent progress"],
  };

  Object.keys(synonyms).forEach((phrase) => {
    const options = synonyms[phrase];
    const replacement = options[Math.floor(Math.random() * options.length)];
    restored = restored.replace(new RegExp(phrase, "gi"), replacement);
  });

  // Step 4: Light cleanup
  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
