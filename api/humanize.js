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

This will be tested against GPTZero and must score 0% AI detected. Real human writing is uneven, specific, and never wraps up neatly.

HARD RULES — no exceptions:
- Every number, percentage, dollar amount, year, and company name stays exactly as written
- No new facts or figures

HUMAN WRITING RULES — all must appear:
- At least one sentence under 8 words
- At least one sentence over 30 words using a comma, dash, or parenthetical
- At least two contractions (it's, didn't, wasn't, that's, they're)
- At least one sentence starting with But, And, or So
- Paragraphs must be uneven — at least one single-sentence paragraph and one paragraph with 3+ sentences
- No two consecutive sentences start with the same word

BANNED — never use any of these:
- Furthermore, Moreover, Notably, Overall, Ultimately, Clearly
- In conclusion, In summary, To summarize
- It is worth noting, This demonstrates, This suggests, This indicates
- leverage, utilize, facilitate, delve, underscore, robust, pivotal, crucial, navigate, highlight
- "worth watching", "worth paying attention to", "conditions evolve", "tells a story"
- "reflects confidence", "underlying demand", "headline growth rate", "demand patterns"
- ANY sentence that analyzes what the data means or implies — just report it
- ANY closing sentence that interprets, summarizes, or draws a conclusion
- ANY phrase like "what that means is", "what this tells us", "the picture here is"
- The word "meaningful" — delete it every time

CRITICAL: End the rewrite on a plain fact. Never end with analysis, interpretation, or an observation about what the numbers suggest.

Return only the rewritten text. No intro, no explanation.

TEXT:
${text}`;
}

function buildBreakPrompt(text) {
  return `You are a human editor. Make only these surgical changes — do not rewrite:

1. Find any two consecutive sentences starting with the same word — change the opening word of one
2. Find the single longest sentence — break it into two at the most natural pause
3. If there are fewer than two contractions, add them (it's, didn't, wasn't, that's)
4. Check the final sentence — if it sounds like a conclusion, analysis, or interpretation, delete it entirely
5. If every paragraph is more than one sentence, cut one paragraph down to a single sentence
6. Do not touch any number, percentage, dollar amount, year, or company name
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
  t = t.replace(/\bmeaningful(ly)?\b/gi, "");
  t = t.replace(/\bunderlying\b/gi, "");
  t = t.replace(/\bheadline\b/gi, "");
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
