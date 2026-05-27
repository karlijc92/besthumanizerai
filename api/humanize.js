export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || !mode) {
    return res.status(400).json({ error: "Missing text or mode" });
  }

  try {
    const result = await callClaude(buildPrompt(mode, text));
    if (!result) return res.status(500).json({ error: "Rewrite failed" });
    return res.status(200).json({ result: cleanUp(result) });

  } catch (e) {
    console.error("Handler error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

async function callClaude(prompt) {
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
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error("Claude API error: " + JSON.stringify(err));
  }

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

HARD RULES:
- Every number, percentage, dollar amount, year, and company name stays exactly as written
- No new facts or figures
- Only report facts — no analysis, no interpretation, no conclusions

STRUCTURE — all must appear:
- Mix sentence lengths — some under 8 words, some over 25 words
- At least two contractions (it's, didn't, wasn't, that's, they're)
- At least one sentence starting with But, And, or So
- At least one single-sentence paragraph
- At least one paragraph with 3 or more sentences
- No two consecutive sentences start with the same word
- Last sentence must be a plain fact — never analysis or interpretation

NEVER USE:
- Furthermore, Moreover, Notably, Overall, Ultimately, Clearly
- In conclusion, In summary, To summarize
- It is worth noting, This demonstrates, This suggests, This indicates
- leverage, utilize, facilitate, delve, underscore, robust, pivotal, crucial, meaningful, underlying, narrative, headwinds
- "worth watching", "tells a story", "reflects confidence", "beneath the surface"
- "complicated picture", "demand patterns", "geography underneath"
- Any sentence that explains what the data means or implies

Return only the rewritten text. Nothing else.

TEXT:
${text}`;
}

function cleanUp(text) {
  let t = text;

  // Fix number spacing
  t = t.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  t = t.replace(/(\d),\s+(\d)/g, "$1,$2");

  // Remove AI phrases
  t = t.replace(/\bFurthermore,?\s*/gi, "");
  t = t.replace(/\bMoreover,?\s*/gi, "");
  t = t.replace(/\bNotably,?\s*/gi, "");
  t = t.replace(/\bUltimately,?\s*/gi, "");
  t = t.replace(/\bOverall,?\s*/gi, "");
  t = t.replace(/\bClearly,?\s*/gi, "");
  t = t.replace(/\bIn conclusion,?\s*/gi, "");
  t = t.replace(/\bIn summary,?\s*/gi, "");
  t = t.replace(/\bTo summarize,?\s*/gi, "");
  t = t.replace(/\bIt is worth noting that\s*/gi, "");
  t = t.replace(/\bIt's worth noting that\s*/gi, "");
  t = t.replace(/\bThis demonstrates\b/gi, "This shows");
  t = t.replace(/\bThis suggests\b/gi, "This points to");
  t = t.replace(/\bThis indicates\b/gi, "This means");
  t = t.replace(/\butilize[sd]?\b/gi, "use");
  t = t.replace(/\bleverage[sd]?\b/gi, "use");
  t = t.replace(/\bfacilitate[sd]?\b/gi, "help");
  t = t.replace(/\brobust\b/gi, "strong");
  t = t.replace(/\bpivotal\b/gi, "key");
  t = t.replace(/\bcrucial\b/gi, "important");
  t = t.replace(/\bunderscore[sd]?\b/gi, "show");
  t = t.replace(/\bdelve[sd]?\b/gi, "dig");
  t = t.replace(/\bmeaningful(ly)?\b/gi, "real");
  t = t.replace(/\bunderlying\b/gi, "actual");
  t = t.replace(/\bnarrative\b/gi, "story");
  t = t.replace(/\bheadwinds\b/gi, "pressure");
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}
