module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const modeInstructions = {
    "data-safe": "natural, conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented resume",
    "plain": "simple plain English",
  };

  const tone = modeInstructions[mode] || modeInstructions["data-safe"];

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const sentenceStyles = [
    "Rewrite this one sentence like a financial journalist. Keep it punchy.",
    "Rewrite this one sentence like a smart analyst talking to a colleague.",
    "Rewrite this one sentence conversationally. Short is fine.",
    "Rewrite this one sentence directly. No fluff.",
    "Rewrite this one sentence like a human who just read it and is summarizing it.",
  ];

  // Rewrite each sentence individually with its own protected numbers
  const rewrittenSentences = await Promise.all(
    sentences.map(async (sentence, i) => {
      const sentenceProtectedItems = [];
      const protectedSentence = sentence.replace(
        /(\$\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?\s?%|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
        (match) => {
          sentenceProtectedItems.push(match.trim());
          return "DATASLOT";
        }
      );

      const style = sentenceStyles[i % sentenceStyles.length];

      const prompt = `${style} Tone: ${tone}.
The word DATASLOT is a number placeholder — keep every DATASLOT exactly as DATASLOT.
Use contractions naturally. Never use: "notably", "furthermore", "moreover", "showcasing", "highlighting", "underscoring", "it is worth noting", "it is important to note".
Output ONLY the rewritten sentence. Nothing else.

Sentence: ${protectedSentence.trim()}`;

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
            max_tokens: 200,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        if (!response.ok) return sentence;

        let rewritten = data.content[0].text.trim();

        // Restore numbers for this sentence only
        let slotIndex = 0;
        rewritten = rewritten.replace(/DATASLOT/g, () => {
          const value = sentenceProtectedItems[slotIndex];
          slotIndex++;
          return value !== undefined ? value : "DATASLOT";
        });

        return rewritten;
      } catch {
        return sentence;
      }
    })
  );

  let restored = rewrittenSentences.join(" ");

  // Light cleanup
  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
