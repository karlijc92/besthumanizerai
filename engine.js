// ============================================================
// BestHumanizerAI — engine.js (self-contained, no API needed)
// ============================================================

const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";
const FREE_REWRITES = 300;
const FREE_CHARACTER_LIMIT = 1000;

let lastHumanizedText = "";

const humanizeBtn = document.getElementById("humanizeBtn");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const rewriteCount = document.getElementById("rewriteCount");
const characterCount = document.getElementById("characterCount");
const upgradeMessage = document.getElementById("upgradeMessage");
const rewriteMode = document.getElementById("rewriteMode");
const copyBtn = document.getElementById("copyBtn");

// ── Usage tracking ───────────────────────────────────────────
function getRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}
function setRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}
function updateRewriteDisplay() {
  const used = getRewriteCount();
  rewriteCount.textContent = `${used} / ${FREE_REWRITES} Free Rewrites Used`;
}
function updateCharacterDisplay() {
  const count = inputText.value.length;
  characterCount.textContent = `${count} / ${FREE_CHARACTER_LIMIT} Characters`;
}

// ── Data protection ──────────────────────────────────────────
// Step 1: replace every number/date/citation with a placeholder token
function protectNumbers(text) {
  const items = [];
  const protected_text = text.replace(
    /(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?%?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?(?:19|20)\d{2}\))/gi,
    (match) => {
      items.push(match);
      return `__PROTECT${items.length - 1}__`;
    }
  );
  return { protected_text, items };
}

// Step 2: restore tokens back to original values
function restoreNumbers(text, items) {
  return text.replace(/__PROTECT(\d+)__/g, (match, index) => {
    return items[parseInt(index, 10)] !== undefined ? items[parseInt(index, 10)] : match;
  });
}

// ── Cleanup ──────────────────────────────────────────────────
function cleanupText(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");
  cleaned = cleaned.replace(/([.,;:!?])([A-Za-z])/g, "$1 $2");
  cleaned = cleaned.replace(/\.\s*\./g, ".");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+\)/g, ")");
  cleaned = cleaned.replace(/\(\s+/g, "(");
  cleaned = cleaned.replace(/(%)([A-Za-z])/g, "$1 $2");
  // Capitalise first letter of each sentence
  cleaned = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => {
      const t = s.trim();
      if (!t) return "";
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .filter(Boolean)
    .join(" ");
  return cleaned.trim();
}

// ── Rewrite helpers ──────────────────────────────────────────
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length < 2) return text;
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }
  return sentences.join(" ");
}

function rewriteSentence(sentence, mode) {
  const replacements = {
    demonstrates: ["shows", "reveals", "indicates"],
    significant:  ["major", "notable", "important"],
    increase:     ["rise", "growth", "climb"],
    decrease:     ["drop", "decline", "reduction"],
    approximately:["around", "roughly", "close to"],
    therefore:    ["because of this", "as a result", "for that reason"],
    additionally: ["also", "in addition", "plus"],
    however:      ["still", "even so", "at the same time"],
    utilized:     ["used", "applied"],
    regarding:    ["about", "related to"],
    achieved:     ["reached", "hit", "delivered"],
    reported:     ["posted", "recorded", "noted"],
    generated:    ["produced", "brought in", "earned"],
    represents:   ["makes up", "accounts for", "equals"],
    compared:     ["measured against", "relative to", "vs"],
  };

  let rewritten = sentence;
  Object.keys(replacements).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    rewritten = rewritten.replace(regex, () => randomChoice(replacements[word]));
  });

  // Mode-specific tweaks
  if (mode === "academic") {
    rewritten = rewritten.replace(/\bshows\b/gi, "illustrates");
    rewritten = rewritten.replace(/\bused\b/gi, "employed");
  }
  if (mode === "business" || mode === "executive") {
    rewritten = rewritten.replace(/\bimportant\b/gi, "strategic");
    rewritten = rewritten.replace(/\bused\b/gi, "leveraged");
  }
  if (mode === "resume") {
    rewritten = rewritten.replace(/\bused\b/gi, "executed");
    rewritten = rewritten.replace(/\bled\b/gi, "drove");
  }
  if (mode === "plain") {
    rewritten = rewritten.replace(/\bemployed\b/gi, "used");
    rewritten = rewritten.replace(/\billustrates\b/gi, "shows");
  }

  return rewritten;
}

// ── Main humanize function ───────────────────────────────────
function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  // 1. Lock all numbers/dates/citations
  const { protected_text, items } = protectNumbers(text);

  // 2. Rewrite sentences
  let rewritten = protected_text.trim().replace(/\s+/g, " ");
  const sentences = rewritten.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    rewritten = sentences.map((s) => rewriteSentence(s, mode)).join(" ");
  }

  // 3. Shuffle sentence order for variety
  rewritten = shuffleSentences(rewritten);

  // 4. Restore all protected values
  rewritten = restoreNumbers(rewritten, items);

  // 5. Clean up spacing and punctuation
  rewritten = cleanupText(rewritten);

  return rewritten;
}

// ── Button handler ───────────────────────────────────────────
humanizeBtn.addEventListener("click", function () {
  const currentCount = getRewriteCount();

  // Re-humanize output if it exists, otherwise use input
  const originalInput =
    outputText.value.trim() !== "" ? outputText.value.trim() : inputText.value.trim();

  if (!originalInput) {
    alert("Please enter text to humanize.");
    return;
  }

  if (currentCount >= FREE_REWRITES && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML =
      'You have reached the free rewrite limit. <a href="pricing.html">Upgrade to continue.</a>';
    return;
  }

  if (originalInput.length > FREE_CHARACTER_LIMIT && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML =
      'Free accounts are limited to 1,000 characters. <a href="pricing.html">Upgrade for longer text.</a>';
    return;
  }

  const selectedMode = rewriteMode ? rewriteMode.value.toLowerCase() : "data-safe";

  // Run 4 passes for maximum humanization
  let rewritten = originalInput;
  for (let i = 0; i < 4; i++) {
    rewritten = aggressiveHumanize(rewritten, selectedMode);
  }

  lastHumanizedText = rewritten;
  outputText.value = rewritten;
  setRewriteCount(currentCount + 1);
  updateRewriteDisplay();
  upgradeMessage.innerHTML = "";
});

// ── Copy button ──────────────────────────────────────────────
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    if (!outputText.value.trim()) {
      alert("Nothing to copy yet.");
      return;
    }
    navigator.clipboard.writeText(outputText.value).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Output"), 2000);
    });
  });
}

// ── Character counter ────────────────────────────────────────
inputText.addEventListener("input", function () {
  updateCharacterDisplay();
});

// ── Init ─────────────────────────────────────────────────────
updateRewriteDisplay();
updateCharacterDisplay();
