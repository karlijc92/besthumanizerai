module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, mode } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  const protectedItems = [];
  const protectedText = text.replace(
    /(\$\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?\s?%|\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      protectedItems.push(match.trim());
      return "DATASLOT";
    }
  );

  const toneMap = {
    "data-safe": "natural and conversational but professional",
    "academic": "formal academic",
    "business": "professional business report",
    "executive": "concise executive summary",
    "resume": "strong action-oriented",
    "plain": "simple plain English",
  };

  const tone = toneMap[mode] || toneMap["data-safe"];

  const personas = [
    "You're a financial journalist who writes fast and cuts every unnecessary word. You hate corporate jargon. You write how you think.",
    "You're a senior analyst who explains things like you're talking to a smart colleague, not writing a report. Casual but sharp.",
    "You're a grad student who knows this material cold but writes how real people talk — not how textbooks sound.",
    "You're an editor at a business magazine. You make dense financial writing readable without dumbing it down.",
    "You're a consultant who's been in the industry 20 years. You write bluntly, confidently, and without filler.",
    "You're a blogger who covers finance. You make numbers feel real to people, not just analysts.",
  ];
  const persona = personas[Math.floor(Math.random() * personas.length)];

  const variations = [
    "Mix sentence lengths aggressively. Some very short. Some longer and flowing.",
    "Use a question somewhere if it fits naturally. Break up the rhythm.",
    "Start at least one sentence with And or But. It's fine — real writers do it.",
    "Use a dash or two where a comma feels too formal.",
    "Let one sentence stand alone as its own paragraph if it lands harder that way.",
  ];
  const picked = variations.sort(() => 0.5 - Math.random()).slice(0, 2).join(" ");

  const pass1 = `${persona}

Rewrite the following text in a ${tone} tone. ${picked}

Rules you must follow:
- DATASLOT is a placeholder for a number or citation. Never change, move, or remove any DATASLOT. Count them — your output must have the exact same number as the input.
- Do not change the order of the information.
- Never use: notably, furthermore, moreover, in conclusion, it is important to note, delve, utilize, showcasing, highlighting, underscoring, it is worth noting, on the surface, the trajectory, across the board, at the end of the day, bottom line, speaks volumes, tells a story, paint a picture, firing on all cylinders, real momentum, solid growth.
- Output only the rewritten text. Nothing else.

Text:
${protectedText}`;

  const pass2Instructions = [
    "Read this and make it sound even more like a real person wrote it. Vary the rhythm. If anything sounds stiff or robotic fix it. Keep all DATASLOT placeholders exactly as they are.",
    "Polish this so it sounds less like AI wrote it. Break up any sentences that feel too smooth or formulaic. Keep all DATASLOT placeholders exactly as they are.",
    "Make this feel more natural and human. If two sentences sound too similar in structure, change one of them. Keep all DATASLOT placeholders exactly as they are.",
  ];
  const pass2 = pass2Instructions[Math.floor(Math.random() * pass2Instructions.length)];

  let finalOutput;
  try {
    const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: pass1 }],
      }),
    });

    const data1 = await res1.json();
    if (!res1.ok) return res.status(500).json({ error: "Claude API error on pass 1", detail: data1 });
    const pass1Output = data1.content[0].text;

    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          { role: "user", content: pass1 },
          { role: "assistant", content: pass1Output },
          { role: "user", content: pass2 },
        ],
      }),
    });

    const data2 = await res2.json();
    if (!res2.ok) return res.status(500).json({ error: "Claude API error on pass 2", detail: data2 });
    finalOutput = data2.content[0].text;

  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Claude API", detail: err.message });
  }

  let slotIndex = 0;
  let restored = finalOutput.replace(/DATASLOT/g, () => {
    const value = protectedItems[slotIndex];
    slotIndex++;
    return value !== undefined ? value : "DATASLOT";
  });

  restored = restored
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:!?])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();

  return res.status(200).json({ result: restored });
};
