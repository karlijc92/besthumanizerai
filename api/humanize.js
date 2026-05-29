module.exports = async function handler(req, res) {
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

  const styles = [
    "Write like a financial journalist on deadline — punchy, direct, no fluff.",
    "Write like a senior analyst explaining this to a colleague over coffee.",
    "Write like someone who just read this and is telling a friend what it said.",
    "Write like a sharp MBA student who skips the corporate speak.",
    "Write like a tired grad student who knows their stuff but writes how they think.",
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];

  const prompt = `You are a human writer. ${style}

Rewrite the text below in a ${tone} tone.

STRICT RULES:
1. The word DATASLOT is a number placeholder. Keep every DATASLOT exactly as the word DATASLOT. Do not replace, skip, add, or remove any DATASLOT. The number of DATASLOTs in your output must exactly match the number in the input.
2. Keep sentences in the SAME ORDER as the original. Do not reorder, merge, or split sentences.
3. Rewrite the words around the DATASLOTs — not the DATASLOTs themselves.
4. Use contractions. Use dashes. Mix short and long sentences.
5. Start 1 or 2 sentences with "And" or "But".
6. NEVER use: "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "showcasing", "highlighting", "underscoring", "no doubt", "on the surface", "on paper", "the trajectory", "worth noting", "real momentum", "solid growth", "hitting its stride", "firing on all cylinders", "bottom line", "across the board", "at the end of the day".
7. Output ONLY the rewritten text. No intro, no explanation, no questions.

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

  // Restore numbers in order
  let slotIndex = 0;
  let restored = claudeOutput.replace(/DATASLOT/g, () => {
    const value = protectedItems[slotIndex];
    slotIndex++;
    return value !== undefined ? value : "DATASLOT";
  });

  // Light cleanup
  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
