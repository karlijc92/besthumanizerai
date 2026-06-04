// cleanup.js — safe for [[NUMSLOT_N]] labeled placeholders

function cleanupHumanizedText(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // ── 1. Temporarily shield placeholders from regex rules ──────────────────
  // Replace [[NUMSLOT_N]] with a safe single token that no rule will touch
  const placeholderMap = {};
  let placeholderIndex = 0;
  cleaned = cleaned.replace(/\[\[NUMSLOT_\d+\]\]/g, (match) => {
    const token = `SAFESLOT${placeholderIndex++}X`;
    placeholderMap[token] = match;
    return token;
  });

  // ── 2. Standard cleanup (now safe — no real placeholders present) ─────────
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");
  cleaned = cleaned.replace(/([.,;:!?])([A-Za-z])/g, "$1 $2");
  cleaned = cleaned.replace(/\.\s*\./g, ".");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+\)/g, ")");
  cleaned = cleaned.replace(/\(\s+/g, "(");
  cleaned = cleaned.replace(/(\$?\d+(?:\.\d+)?)(\s*)\.(\s*)([A-Za-z])/g, "$1. $4");
  cleaned = cleaned.replace(/(%)([A-Za-z])/g, "$1 $2");

  // ── 3. Sentence capitalisation ────────────────────────────────────────────
  cleaned = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const trimmed = sentence.trim();
      if (!trimmed) return "";
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .filter(Boolean)
    .join(" ");

  // ── 4. Duplicate phrase cleanup ───────────────────────────────────────────
  cleaned = cleaned.replace(/\bInterestingly,\s+interestingly,\s+/gi, "Interestingly, ");
  cleaned = cleaned.replace(/\bFrom a broader perspective,\s+from a broader perspective,\s+/gi, "From a broader perspective, ");
  cleaned = cleaned.replace(/\bIn practical terms,\s+in practical terms,\s+/gi, "In practical terms, ");

  // ── 5. Restore placeholders ───────────────────────────────────────────────
  Object.entries(placeholderMap).forEach(([token, original]) => {
    cleaned = cleaned.replace(new RegExp(token, "g"), original);
  });

  return cleaned.trim();
}
