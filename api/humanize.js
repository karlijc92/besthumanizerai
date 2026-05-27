export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || !mode) {
    return res.status(400).json({ error: "Missing text or mode" });
  }

  try {
    const pass1 = await callClaude(buildPrompt(mode, text));
    if (!pass1) return res.status(500).json({ error: "Rewrite failed" });

    const pass2 = await callClaude(buildBreakPrompt(pass1));
    if (!pass2) return res.status(500).json({ error: "Pass 2 failed" });

    const final = cleanUp(pass2);
    return res.status(200).json({ result: final });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
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

This rewrite will be tested against GPTZero. It must score 0% AI. To do that you must write the way a real human does — which means imperfect, uneven, and specific.

HARD RULES — no exceptions:
- Every number, percentage, dollar amount, year, and company name stays exactly as written
- No new facts or figures

HUMAN WRITING RULES — all must appear in your output:
- At least one sentence under 8 words
- At least one sentence over 30 words that uses a comma, a dash, or a parenthetical
- At least two contractions (it's, didn't, wasn't, that's, they're, here's)
- At least one sentence starting with But, And, or So
- Paragraphs must be uneven — at least one single-sentence paragraph and one paragraph with 3+ sentences
- One specific observation that shows you actually understand the data — not vague, not motivational, just real
- No two consecutive sentences can start with the same word

BANNED WORDS AND PHRASES — never use these:
- Furthermore, Moreover, Notably, Overall, Ultimately, Clearly
- In conclusion, In summary, To summarize
- It is worth noting, This demonstrates, This suggests, This indicates
- leverage, utilize, facilitate, delve, underscore, robust, pivotal, crucial, navigate, highlight
- "worth watching", "conditions evolve", "tells a story", "reflects confidence", "space to watch"
- Any sentence that ends by explaining what something "means for the future"

Return only the rewritten text. No intro, no explanation.

TEXT:
${text}`;
}

function buildBreakPrompt(text) {
  return `You are a human editor. Do NOT rewrite this — make only these surgical changes:

1. Find any two consecutive sentences that start with the same word — change the opening word of one of them
2. Find the single longest sentence — break it into two at the most natural pause
3. If there are no contractions, add two (it's, didn't, wasn't, that's)
4. If every paragraph is more than one sentence, pick one paragraph and cut it to a single sentence
5. Do not touch any number, percentage, dollar amount, year, or company name
6. Do not add any new information
7. Return only the text — no commentary

TEXT:
${text}`;
}

function cleanUp(text) {
  let t = text;
  t = t.replace(/\bFurthermore,\s*/gi, "");
  t = t.replace(/\bMoreover,\s*/gi, "");
  t = t.replace(/\bNotably,\s*/gi, "");
  t = t.replace(/\bIn conclusion,\s*/gi, "");
  t = t.replace(/\bIn summary,\s*/gi, "");
  t = t.replace(/\bTo summarize,\s*/gi, "");
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
  t = t.replace(/\bnavigate[sd]?\b/gi, "manage");
  t = t.replace(/\bunderscore[sd]?\b/gi, "show");
  t = t.replace(/\bdelve[sd]?\b/gi, "dig");
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
