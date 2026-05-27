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

    const pass3 = await callClaude(buildHumanFinalPass(pass2));
    if (!pass3) return res.status(500).json({ error: "Pass 3 failed" });

    const final = cleanUp(pass3);
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

  return `You are ${tone}. Rewrite the following text so it reads as natural human writing — not AI-generated.

RULES YOU MUST FOLLOW:
- Never change any number, percentage, dollar amount, year, company name, or statistic — ever
- Do not add new facts or figures
- Write like a real person who knows this topic well — not like a writing assistant
- Use varied sentence lengths — some very short, some longer, never uniform
- Use contractions naturally (it's, didn't, they're, wasn't, that's)
- Occasionally start a sentence with And, But, or So
- Use a dash — or parenthetical (like this) — for natural rhythm once or twice
- Write in paragraphs of unequal length

THINGS YOU MUST NEVER DO:
- Never use: Furthermore, Moreover, Notably, In conclusion, In summary, It is worth noting, This demonstrates, This suggests, This indicates, Overall, To summarize, It's worth noting, Clearly, Ultimately
- Never use fake enthusiasm or planted questions like "Pretty impressive, right?" or "So here's the story:"
- Never end with a filler observation like "a space worth watching" or "conditions continue to evolve"
- Never use uniform paragraph lengths
- Never sound like a press release or a writing assistant summarizing data
- Never use: leverage, utilize, facilitate, delve, underscore, highlight, navigate, landscape, robust, crucial, pivotal

Return only the rewritten text. Nothing else.

TEXT:
${text}`;
}

function buildBreakPrompt(text) {
  return `You are a human editor reviewing a draft. Make these exact changes:

1. Find the 2 longest sentences and break each into two — split at a natural pause
2. Find 2 short sentences next to each other and combine them into one
3. Remove any sentence that sounds like a conclusion or summary — cut it entirely
4. If any sentence starts with "This" followed by a verb (This shows, This reflects, This means) — rewrite it to not start with "This"
5. Make sure no two consecutive paragraphs are the same length
6. Do not change any number, percentage, dollar amount, year, or company name
7. Return only the edited text — no explanation, no commentary

TEXT:
${text}`;
}

function buildHumanFinalPass(text) {
  return `You are a copy editor. Your only job is to remove AI writing patterns from the text below.

Find and fix:
- Any sentence that sounds like a wrap-up or closing observation — delete it or rewrite it as a plain fact
- Any word or phrase that feels performative or editorial (e.g. "meaningful", "impressive", "worth watching", "confidence in the business", "tells a story")
- Any transition that an AI would use to sound smooth — replace with nothing or a simpler word
- Any place where two sentences in a row start with the same word — vary one of them
- Any sentence that explains what the data "means" in a vague motivational way — cut it or make it a plain statement

Do not change any number, percentage, dollar amount, year, or company name.
Do not add anything new.
Return only the cleaned text.

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
