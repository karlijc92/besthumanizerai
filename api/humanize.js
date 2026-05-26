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
    let result = data.content?.[0]?.text?.trim();

    if (!result) {
      return res.status(500).json({ error: "No response from Claude" });
    }

    result = secondPass(result);

    return res.status(200).json({ result });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

function secondPass(text) {
  let t = text;

  // Break up any remaining AI-style transition openers
  t = t.replace(/\bIt is worth noting that\b/gi, "");
  t = t.replace(/\bIt's worth noting that\b/gi, "");
  t = t.replace(/\bNotably,\s*/gi, "");
  t = t.replace(/\bFurthermore,\s*/gi, "");
  t = t.replace(/\bMoreover,\s*/gi, "");
  t = t.replace(/\bIn conclusion,\s*/gi, "");
  t = t.replace(/\bIn summary,\s*/gi, "");
  t = t.replace(/\bTo summarize,\s*/gi, "");
  t = t.replace(/\bOverall,\s*/gi, pick(["All told,", "When you step back,", ""]));
  t = t.replace(/\bThis demonstrates\b/gi, pick(["This shows", "That proves", "This makes clear"]));
  t = t.replace(/\bThis indicates\b/gi, pick(["This shows", "That tells you", "This means"]));
  t = t.replace(/\bThis suggests\b/gi, pick(["This points to", "That implies", "It looks like"]));
  t = t.replace(/\bsignificant(ly)?\b/gi, (m, p) => p ? pick(["sharply", "meaningfully", "considerably"]) : pick(["real", "meaningful", "considerable"]));
  t = t.replace(/\butilize[sd]?\b/gi, "use");
  t = t.replace(/\bdemonstrate[sd]?\b/gi, pick(["show", "prove", "make clear"]));
  t = t.replace(/\bfacilitate[sd]?\b/gi, pick(["help", "drive", "support"]));
  t = t.replace(/\bleverage[sd]?\b/gi, pick(["use", "tap into", "lean on"]));
  t = t.replace(/\bimplementing\b/gi, pick(["rolling out", "putting in place", "using"]));
  t = t.replace(/\bcommencement\b/gi, "start");
  t = t.replace(/\bsubsequently\b/gi, pick(["after that", "then", "later"]));
  t = t.replace(/\bnevertheless\b/gi, pick(["still", "even so", "but"]));
  t = t.replace(/\bin order to\b/gi, "to");
  t = t.replace(/\bprior to\b/gi, "before");
  t = t.replace(/\bdue to the fact that\b/gi, pick(["because", "since", "given that"]));

  // Vary sentence endings occasionally
  t = t.replace(/\. (They|It|This|That|The) /g, (m) => {
    return Math.random() > 0.6 ? m : ".\n" + m.slice(2);
  });

  // Clean up double spaces and spacing issues
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.trim();

  return t;
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSystemPrompt(mode) {
  const shared = `You are rewriting AI-generated text so it passes AI detection tools as 100% human-written.

STRICT RULES:
1. Preserve ALL numbers, percentages, dollar amounts, years, company names, citations, and statistics EXACTLY as they appear. Do not change them at all.
2. Do NOT add new facts or figures.
3. NEVER use these phrases: "Worth noting", "Tied to that", "Furthermore", "Moreover", "It is worth noting", "Notably", "In conclusion", "In summary", "This demonstrates", "This suggests", "This indicates".
4. Write with natural human variation — some sentences very short. Some longer and more detailed. Never uniform.
5. Use contractions naturally (it's, that's, wasn't, didn't, they're).
6. Occasionally start sentences with And, But, or So.
7. Use active voice.
8. Do not sound like a press release or corporate document.
9. Write like a real person who knows this subject well and is explaining it naturally.
10. Return ONLY the rewritten text. Nothing else.`;

  const tones = {
    "data-safe": "Write like a sharp financial journalist explaining results to an informed reader. Conversational but precise.",
    "academic": "Write like a confident graduate student who knows the material well. Formal but not stiff.",
    "business": "Write like a senior analyst briefing leadership. Direct, no fluff, active voice.",
    "executive": "Write like a CFO summarizing for the board. Lead with the key point. Every word earns its place.",
    "resume": "Write like a top recruiter crafting bullet points. Strong verbs, concrete impact, no filler.",
    "plain": "Write like you're explaining to a smart friend. Short sentences. Real words. Zero jargon."
  };

  return shared + "\n\n" + (tones[mode] || tones["plain"]);
}
