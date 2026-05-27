const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";

const FREE_REWRITES = 3;
const FREE_CHARACTER_LIMIT = 1000;

let lastHumanizedText = "";

const humanizeBtn = document.getElementById("humanizeBtn");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const rewriteCount = document.getElementById("rewriteCount");
const characterCount = document.getElementById("characterCount");
const upgradeMessage = document.getElementById("upgradeMessage");
const rewriteMode = document.getElementById("rewriteMode");

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

function extractProtectedData(text) {
  const patterns = [
    /\$?\d+(?:,\d{3})*(?:\.\d+)?%?/g,
    /\b\d{4}\b/g,
    /\([A-Za-z]+,\s?\d{4}\)/g
  ];

  const protectedItems = [];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern);

    if (matches) {
      matches.forEach((item) => {
        if (!protectedItems.includes(item)) {
          protectedItems.push(item);
        }
      });
    }
  });

  return protectedItems;
}

function preserveProtectedData(original, rewritten) {
  const originalProtected = extractProtectedData(original);
  const rewrittenProtected = extractProtectedData(rewritten);

  originalProtected.forEach((item, index) => {
    if (rewrittenProtected[index] !== item) {
      rewritten = rewritten.replace(rewrittenProtected[index] || "", item);
    }
  });

  return rewritten;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g);

  if (!sentences || sentences.length < 2) {
    return text;
  }

  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }

  return sentences.join(" ");
}

function rewriteSentence(sentence, mode) {
  const replacements = {
    demonstrates: ["shows", "reveals", "indicates"],
    significant: ["major", "notable", "important"],
    increase: ["rise", "growth", "climb"],
    decrease: ["drop", "decline", "reduction"],
    approximately: ["around", "roughly", "close to"],
    therefore: ["because of this", "as a result", "for that reason"],
    additionally: ["also", "in addition", "plus"],
    however: ["still", "even so", "at the same time"],
    utilized: ["used", "applied"],
    regarding: ["about", "related to"]
  };

  let rewritten = sentence;

  Object.keys(replacements).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");

    rewritten = rewritten.replace(regex, () => {
      return randomChoice(replacements[word]);
    });
  });

  if (mode === "academic") {
    rewritten = rewritten.replace(/\bshows\b/gi, "illustrates");
  }

  if (mode === "business") {
    rewritten = rewritten.replace(/\bimportant\b/gi, "strategic");
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/\bused\b/gi, "executed");
  }

  return rewritten;
}

function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let rewritten = text.trim();

  rewritten = rewritten.replace(/\s+/g, " ");

  const sentences = rewritten.match(/[^.!?]+[.!?]+/g);

  if (sentences) {
    rewritten = sentences
      .map((sentence) => rewriteSentence(sentence, mode))
      .join(" ");
  }

  rewritten = shuffleSentences(rewritten);

  rewritten = preserveProtectedData(text, rewritten);

  return rewritten;
}

humanizeBtn.addEventListener("click", () => {
  const currentCount = getRewriteCount();

  const originalInput =
    outputText.value.trim() !== ""
      ? outputText.value.trim()
      : inputText.value.trim();

  if (!originalInput) {
    alert("Please enter text to humanize.");
    return;
  }

  if (
    currentCount >= FREE_REWRITES &&
    !document.body.classList.contains("paid-user")
  ) {
    upgradeMessage.innerHTML =
      "You have reached the free rewrite limit. Please upgrade to continue.";
    return;
  }

  if (
    originalInput.length > FREE_CHARACTER_LIMIT &&
    !document.body.classList.contains("paid-user")
  ) {
    upgradeMessage.innerHTML =
      "Free accounts are limited to 1,000 characters.";
    return;
  }

  const selectedMode = rewriteMode
    ? rewriteMode.value.toLowerCase()
    : "regular";

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

inputText.addEventListener("input", () => {
  updateCharacterDisplay();
});

updateRewriteDisplay();
updateCharacterDisplay();
