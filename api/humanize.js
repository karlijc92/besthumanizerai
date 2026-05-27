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
    console.error("Handler error:", e);
    return res.status(500).json({ error: "Server error: " + e.message });
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
      temperature: 1.0,
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
- leverage, utilize, facilitate, delve, underscore, robust, pivotal, crucial, navigate, highlight, meaningful, underlying, narrative
- "worth watching", "tells a story", "reflects confidence", "beneath the surface"
- "complicated picture", "geography underneath", "demand patterns"
- Any sentence that analyzes what the data means or implies
- Any closing sentence that interprets or draws a conclusion

CRITICAL — last sentence must be a plain fact. Never end on analysis or interpretation.

Return only the rewritten text. Nothing else.

TEXT:
${text}`;
}

function buildBreakPrompt(text) {
  return `You are a human editor. Make only these changes:

1. Find any two consecutive sentences starting with the same word — change the opening word of one
2. Find the single longest sentence — break it into two at the most natural pause
3. If there are fewer than two contractions, add them (it's, didn't, wasn't, that's)
4. Check the final sentence — if it sounds like analysis or interpretation, delete it entirely
5. If every paragraph is more than one sentence, cut one paragraph to a single sentence
6. Do not touch any number, percentage, dollar amount, year, or company name
7. Return only the text — no commentary

TEXT:
${text}`;
}

function cleanUp(text) {
  let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const killPhrases = [
    /tells a different story/i,
    /complicated picture/i,
    /geography underneath/i,
    /complicates the narrative/i,
    /beneath the surface/i,
    /undercuts the/i,
    /where the real pressure/i,
    /what's actually happening/i,
    /harder to ignore/i,
    /regional weakness matters/i,
    /demand picture/i,
    /margin story/i,
    /top-line numbers/i,
    /worth paying attention/i,
    /conditions (continue to )?evolve/i,
    /picture here is/i,
    /narrative here/i,
  ];

  sentences = sentences.filter(sentence => {
    return !killPhrases.some(pattern => pattern.test(sentence));
  });

  let t = sentences.join(" ");

  t = t.replace(/\bFurthermore,\s*/gi, "");
  t = t.replace(/\bMoreover,\s*/gi, "");
  t = t.replace(/\bNotably,\s*/gi, "");
  t = t.replace(/\bIn conclusion,\s*/gi, "");
  t = t.replace(/\bIn summary,\s*/gi, "");
  t = t.replace(/\bTo summarize,\s*/gi, "");
  t = t.replace(/\bIt is worth noting that\s*/gi, "");
  t = t.replace(/\bThis demonstrates\b/gi, "shows");
  t = t.replace(/\bThis suggests\b/gi, "points to");
  t = t.replace(/\bThis indicates\b/gi, "means");
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
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
