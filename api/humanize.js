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

  // Split into sentences
  const sentences = protectedText.match(/[^.!?]+[.!?]+/g) || [protectedText];

  const sentenceInstructions = [
    "Rewrite this sentence as if you just thought of it naturally. Keep it casual.",
    "Rewrite this in a direct, no-nonsense way. Cut any fluff.",
    "Rewrite this the way a human analyst would say it out loud.",
    "Rewrite this with a slightly informal tone, like explaining to a colleague.",
    "Rewrite this plainly and simply. Short is fine.",
    "Rewrite this with a bit of personality. Real voice.",
    "Rewrite this as a punchy one-liner if possible.",
    "Rewrite this conversationally, like you're presenting to a small group.",
  ];

  // Rewrite each sentence individually
  const rewrittenSentences = await Promise.all(
    sentences.map(async (sentence, i) => {
      const instruction = sentenceInstructions[i % sentenceInstructions.length];
      const prompt = `${instruction} Tone: ${tone}.
Keep any tokens like NUM0X, NUM1X exactly as-is.
Output ONLY the rewritten sentence, nothing else.

Sentence: ${sentence.trim()}`;

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
        return data.content[0].text.trim();
      } catch {
        return sentence;
      }
    })
  );

  let restored = rewrittenSentences.join(" ");

  restored = restored.replace(/NUM(\d+)X/g, (match, index) => {
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
