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
  const shared = `You are rewriting AI-generated text so it passes AI detection tools as 100% human-written.

STRICT RULES:
1. Preserve ALL numbers, percentages, dollar amounts, years, company names, citations, and statistics EXACTLY as they appear. Do not change them.
2. Do NOT add new facts or figures.
3. NEVER use these phrases: "Worth noting", "Tied to that", "Furthermore", "Moreover", "It is worth noting", "Notably", "In conclusion", "In summary".
4. Write with natural human imperfection — vary sentence length dramatically. Use some very short sentences. Use some longer ones. Do not be uniform.
5. Use contractions naturally where they fit (it's, that's, wasn't, didn't).
6. Occasionally start sentences with And, But, or So — real humans do this.
7. Avoid passive voice where possible.
8. Do not sound like a press release or corporate document.
9. Return ONLY the rewritten text. No commentary, no explanation, no preamble, no suffix.`;

  const tones = {
    "data-safe": "Write like a sharp financial journalist explaining results to an informed reader. Conversational but precise.",
    "academic": "Write like a confident graduate student who knows the material well. Formal but not stiff. Natural academic voice.",
    "business": "Write like a senior analyst briefing leadership. Direct, no fluff, active voice.",
    "executive": "Write like a CFO summarizing for the board. Lead with the key point. Every word earns its place.",
    "resume": "Write like a top recruiter crafting bullet points. Strong verbs, concrete impact, no filler.",
    "plain": "Write like you're explaining to a smart friend. Short sentences. Real words. Zero jargon."
  };

  return shared + "\n\n" + (tones[mode] || tones["plain"]);
}
