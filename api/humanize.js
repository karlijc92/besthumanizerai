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
    "data-safe": "a professional financial writer for a business publication",
    "academic": "an experienced academic researcher",
    "business": "a senior business analyst",
    "executive": "a C-suite executive writing a board summary",
    "resume": "a professional resume writer",
    "plain": "a knowledgeable person explaining to a general audience"
  };

  const tone = tones[mode] || tones["plain"];

  return `You are ${tone}. Rewrite the following text so it is completely undetectable by AI detection tools including GPTZero, Copyleaks, Turnitin, and Originality.ai.

To achieve this you MUST:
- Use highly varied sentence structure — alternate between short punchy sentences and longer detailed ones unpredictably
- Include specific concrete observations that show genuine understanding
- Use industry-specific vocabulary naturally
- Occasionally use a dash — like this — or a parenthetical (like this) for natural rhythm
- Use active voice throughout
- Write in distinct paragraphs of varying length — some one sentence, some three or four
- Use contractions naturally throughout (it's, that's, didn't, they're, wasn't, here's)
- Start occasional sentences with And, But, or So for natural cadence

You MUST NOT:
- Change any number, percentage, dollar amount, year, company name, or statistic
- Add any new facts or figures
- Use: Furthermore, Moreover, Notably, In conclusion, In summary, It is worth noting, This demonstrates, This suggests, This indicates, Overall, To summarize
- Sound like a corporate press release
- Use uniform sentence length
- Return anything except the rewritten text itself

TEXT TO REWRITE:
${text}`;
}

function buildBreakPrompt(text) {
  return `You are an expert editor. Take the text below and make these specific changes to break any remaining AI detection patterns:

1. Find the 3 longest sentences and split each into two shorter ones
2. Find 2 short sentences and merge them into one flowing sentence
3. Add one rhetorical question somewhere natural in the text
4. Replace any remaining formal transitions with casual ones
5. Make sure every paragraph is a different length from the ones around it
6. Keep ALL numbers, percentages, dollar amounts, years, and company names exactly as they are
7. Return ONLY the edited text — no explanation

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
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
