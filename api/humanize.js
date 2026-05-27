export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || !mode) {
    return res.status(400).json({ error: "Missing text or mode" });
  }

  try {
    const pass1 = await callClaude(buildPrompt(mode, text), 1.0);
    if (!pass1) return res.status(500).json({ error: "Rewrite failed" });

    const pass2 = await callClaude(buildBreakPrompt(pass1), 0.9);
    if (!pass2) return res.status(500).json({ error: "Pass 2 failed" });

    const final = cleanUp(pass2);
    return res.status(200).json({ result: final });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

async function callClaude(prompt, temperature = 1.0) {
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
      temperature: temperature,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text?.trim() || null;
}

function buildPrompt(mode, text) {
  const tones = {
    "data-safe": "a financial journalist at a major business publication",
    "academic": "an academic researcher writing for a journal",
    "business": "a senior business analyst writing an internal memo",
    "executive": "a CFO writing notes for a board meeting",
    "resume": "a professional resume writer",
    "plain": "a smart person explaining this to a friend who follows business news"
  };

  const tone = tones[mode] || tones["plain"];

  return `Rewrite the text below as ${tone}.

HARD RULES — no exceptions:
- Every number, percentage, dollar amount, year, and company name stays exactly as written
- No new facts or figures
- Do NOT interpret, analyze, or editorialize — only report the facts

STRUCTURE RULES — all must appear:
- Mix sentence lengths aggressively — some under 8 words, some over 25 words
- At least two contractions (it's, didn't, wasn't, that's, they're)
- At least one sentence starting with But, And, or So
- At least one single-sentence paragraph
- At least one paragraph with 3 or more sentences
- No two consecutive sentences start with the same word

BANNED WORDS — never use:
- Furthermore, Moreover, Notably, Overall, Ultimately, Clearly
- In conclusion, In summary, To summarize
- It is worth noting, This demonstrates, This suggests, This indicates
- leverage, utilize, facilitate, delve, underscore, robust, pivotal, crucial, navigate, highlight, meaningful, underlying, narrative, complicates, deterioration
- "worth watching", "worth paying attention to", "tells a story", "tells a different story"
- "reflects confidence", "headline growth rate", "demand patterns", "beneath the surface"
- "complicated picture", "geography underneath", "regional weakness matters"
- "what this means", "what that means", "what this tells us"

CRITICAL — last sentence must be a plain fact. Never end on analysis, interpretation, or observation.

Return only the rewritten text. No
