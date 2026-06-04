// protect.js — labeled placeholder system

const PLACEHOLDER_PREFIX = "NUMSLOT";

const DATA_PATTERNS = [
  /\bQ[1-4]\s?(?:19|20)\d{2}\b/gi,                                              // Q3 2024 (before bare years)
  /\([A-Za-z]+,\s?(?:19|20)\d{2}\)/g,                                           // (Smith, 2021)
  /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi,     // $1.2 billion, 400,000
  /\d+(?:\.\d+)?%/g,                                                             // 43.7%
  /\b(?:19|20)\d{2}\b/g,                                                         // 2023
  /\b\d+(?:\.\d+)?\s?(?:to|-|–)\s?\$?\d+(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi  // ranges
];

/**
 * Replaces all protected data in text with labeled placeholders.
 * Returns { masked: string, map: { NUMSLOT_0: "42%", NUMSLOT_1: "$1.2 billion", ... } }
 */
function maskProtectedData(text) {
  if (!text || typeof text !== "string") return { masked: text, map: {} };

  const map = {};
  let masked = text;
  let counter = 0;

  // Collect all matches with their positions, longest-first to avoid partial overlaps
  const allMatches = [];
  DATA_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      allMatches.push({ value: m[0].trim(), index: m.index });
    }
  });

  // Sort by position, remove duplicates/overlaps
  allMatches.sort((a, b) => a.index - b.index);
  const deduplicated = [];
  let lastEnd = -1;
  for (const match of allMatches) {
    if (match.index >= lastEnd && match.value.length > 0) {
      deduplicated.push(match);
      lastEnd = match.index + match.value.length;
    }
  }

  // Replace each match with a unique labeled placeholder (in reverse order to preserve indices)
  for (let i = deduplicated.length - 1; i >= 0; i--) {
    const { value, index } = deduplicated[i];
    const key = `${PLACEHOLDER_PREFIX}_${counter++}`;
    map[key] = value;
    masked = masked.slice(0, index) + `[[${key}]]` + masked.slice(index + value.length);
  }

  // Keys were assigned in reverse, flip the map so NUMSLOT_0 = first number in text
  const flippedMap = {};
  const keys = Object.keys(map);
  const total = keys.length;
  keys.forEach((k) => {
    const n = parseInt(k.split("_")[1]);
    const flippedKey = `${PLACEHOLDER_PREFIX}_${total - 1 - n}`;
    flippedMap[flippedKey] = map[k];
  });

  // Re-label placeholders in masked text to match flipped map
  let finalMasked = masked;
  keys.forEach((k) => {
    const n = parseInt(k.split("_")[1]);
    const flippedKey = `${PLACEHOLDER_PREFIX}_${total - 1 - n}`;
    finalMasked = finalMasked.replace(`[[${k}]]`, `[[${flippedKey}]]`);
  });

  return { masked: finalMasked, map: flippedMap };
}

/**
 * Restores labeled placeholders back to their original values.
 * Works correctly even if the AI reordered sentences.
 */
function restoreProtectedData(rewrittenText, map) {
  if (!rewrittenText || typeof rewrittenText !== "string") return rewrittenText;

  let restored = rewrittenText;
  Object.entries(map).forEach(([key, value]) => {
    // Replace [[NUMSLOT_N]] with original value
    restored = restored.replace(new RegExp(`\\[\\[${key}\\]\\]`, "g"), value);
  });

  // Safety net: if AI mangled a placeholder (e.g. dropped brackets), try to catch loose keys
  Object.entries(map).forEach(([key, value]) => {
    restored = restored.replace(new RegExp(key, "g"), value);
  });

  return restored;
}

/**
 * Validates that all original numbers survived the round-trip.
 * Returns { isDataSafe: bool, missing: string[] }
 */
function validateDataIntegrity(originalText, finalText) {
  const originalItems = [];
  DATA_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = regex.exec(originalText)) !== null) {
      const v = m[0].trim();
      if (v && !originalItems.includes(v)) originalItems.push(v);
    }
  });

  const missing = originalItems.filter((item) => !finalText.includes(item));
  return { isDataSafe: missing.length === 0, missing };
}

// Keep old function available so nothing else breaks
function extractProtectedData(text) {
  if (!text || typeof text !== "string") return [];
  const items = [];
  DATA_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      const v = m[0].trim();
      if (v && !items.includes(v)) items.push(v);
    }
  });
  return items;
}
