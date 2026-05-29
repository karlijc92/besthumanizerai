const prompt = `You are a college-educated human writer editing a report. Rewrite the text below so it reads exactly like a real person wrote it — not an AI.

${toneInstruction}

RULES:
1. Tokens like NUM0X, NUM1X, NUM2X are protected values. Keep every single one exactly as-is. Do not change, move, or remove them.
2. Write like a real human: use contractions (it's, they've, that's), occasional sentence fragments, and natural filler phrases like "for context", "to be fair", "worth noting", "at least on paper".
3. Vary sentence length dramatically — some sentences should be very short. One or two words even.
4. Use dashes, parentheses, and informal asides the way a real writer would.
5. Avoid these AI words entirely: "notably", "furthermore", "moreover", "in conclusion", "it is important to note", "delve", "utilize", "it is worth noting", "showcasing", "highlighting", "underscoring".
6. Occasionally start a sentence with "And" or "But" — real writers do this.
7. Do not add new facts or numbers.
8. Output ONLY the rewritten text. No preamble, no explanation.

Text to rewrite:
${protectedText}`;
