export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || !mode) {
    return res.status(400).json({ error: "Missing text or mode" });
  }

  const systemPrompt = buildSystemPrompt(mode);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          { role: "user", content: systemPrompt + "\n\n" + text }
        ]
      })
    });

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim();

    if (!result) {
      return res.status(500).json({ error: "No response from Claude" });
    }

    return res.status(200).json({ result });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

function buildSystemPrompt(mode) {
  const shared = `You are a professional writing editor who rewrites AI-generated text to sound completely human-written.

CRITICAL RULES:
1. Preserve ALL numbers, percentages, dollar amounts, years, company names, citations, and statistics EXACTLY as they appear.
2. Do NOT add new facts or figures.
3. Do NOT use filler phrases like "Worth noting", "Tied to that", "Furthermore", "Moreover".
4. Vary sentence length naturally — mix short and long sentences.
5. Sound like a knowledgeable human wrote this — not an AI.
6. Return ONLY the rewritten text. No commentary, no explanation, no preamble.`;

  const tones = {
    "data-safe": "Tone: Professional finance writer. Clear, direct, plain business English.",
    "academic": "Tone: Formal academic. Scholarly but natural. Sound like a well-read graduate student.",
    "business": "Tone: Business analyst report for senior leadership. Direct, confident, active voice.",
    "executive": "Tone: Executive summary. Lead with the key point. Concise.",
    "resume": "Tone: Strong action-oriented professional writing. Active verbs.",
    "plain": "Tone: Plain English. Short sentences. No jargon."
  };

  return shared + "\n\n" + (tones[mode] || tones["plain"]);
}
