We're at 0% AI — that's the goal! Now we just need to fix the data protection. The `shuffleSentences` function is scrambling everything and breaking the numbers.

Replace your entire `engine.js` with this — same logic, but shuffling removed and number protection fixed:

```javascript
const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";
const FREE_REWRITES = 3;
const FREE_CHARACTER_LIMIT = 1000;

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
  if (rewriteCount) rewriteCount.textContent = used + " / " + FREE_REWRITES + " Free Rewrites Used";
}

function updateCharacterDisplay() {
  const count = inputText ? inputText.value.length : 0;
  if (characterCount) characterCount.textContent = count + " / " + FREE_CHARACTER_LIMIT + " Characters";
}

function protectNumbers(text) {
  const items = [];
  const result = text.replace(/(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:\.\d+)?%|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?)/gi, function(match) {
    items.push(match);
    return "PROTECT" + (items.length - 1) + "END";
  });
  return { result, items };
}

function restoreNumbers(text, items) {
  let result = text.replace(/PROTECT(\d+)END/g, function(match, index) {
    return items[parseInt(index)] || match;
  });
  result = result.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  result = result.replace(/(\d),\s+(\d)/g, "$1,$2");
  return result;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rewriteSentence(sentence, mode) {
  const replacements = {
    "demonstrates": ["shows", "reveals", "makes clear"],
    "significant": ["major", "notable", "real"],
    "increase": ["rise", "jump", "climb"],
    "decrease": ["drop", "decline", "fall"],
    "approximately": ["around", "roughly", "close to"],
    "therefore": ["because of this", "as a result", "so"],
    "additionally": ["also", "on top of that", "and"],
    "however": ["still", "even so", "but"],
    "utilized": ["used", "applied"],
    "regarding": ["about", "on"],
    "reported": ["posted", "recorded", "logged"],
    "represented": ["made up", "accounted for", "came in at"],
    "generated": ["brought in", "pulled in", "posted"],
    "increased": ["rose", "climbed", "jumped"],
    "decreased": ["fell", "dropped", "slid"],
    "decline": ["drop", "fall", "dip"],
    "despite": ["even with", "though"],
    "expansion": ["increase", "jump", "gain"],
    "year-over-year": ["from a year earlier", "versus last year"],
    "prior year": ["year before", "last year"],
    "furthermore": ["and", "also"],
    "moreover": ["and", "also"],
    "notably": ["and", "also"],
    "overall": ["in total", "across the board"],
    "ultimately": ["in the end", "at the end of the day"],
    "robust": ["strong", "solid"],
    "pivotal": ["key", "important"],
    "crucial": ["important", "key"],
    "leverage": ["use", "apply"],
    "facilitate": ["help", "support"],
    "underscore": ["show", "highlight"],
    "meaningful": ["real", "notable"],
    "underlying": ["actual", "core"],
    "narrative": ["story", "picture"],
    "headwinds": ["pressure", "challenges"],
  };

  let rewritten = sentence;

  Object.keys(replacements).forEach(function(word) {
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    rewritten = rewritten.replace(regex, function() {
      return randomChoice(replacements[word]);
    });
  });

  if (mode === "academic") {
    rewritten = rewritten.replace(/\bshows\b/gi, "illustrates");
  }
  if (mode === "business") {
    rewritten = rewritten.replace(/\bimportant\b/gi, "key");
  }
  if (mode === "resume") {
    rewritten = rewritten.replace(/\bused\b/gi, "executed");
  }

  return rewritten;
}

function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  // Protect numbers first
  const { result: protectedText, items } = protectNumbers(text);

  let rewritten = protectedText.trim();
  rewritten = rewritten.replace(/\s+/g, " ");

  // Rewrite sentences without shuffling
  const sentences = rewritten.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    rewritten = sentences.map(function(sentence) {
      return rewriteSentence(sentence, mode);
    }).join(" ");
  }

  // Restore numbers exactly
  rewritten = restoreNumbers(rewritten, items);

  return rewritten;
}

if (humanizeBtn) {
  humanizeBtn.addEventListener("click", function() {
    const currentCount = getRewriteCount();

    const originalInput = inputText ? inputText.value.trim() : "";

    if (!originalInput) {
      alert("Please enter text to humanize.");
      return;
    }

    if (currentCount >= FREE_REWRITES && !document.body.classList.contains("paid-user")) {
      if (upgradeMessage) upgradeMessage.innerHTML = "You have reached the free rewrite limit. Please upgrade to continue.";
      return;
    }

    if (originalInput.length > FREE_CHARACTER_LIMIT && !document.body.classList.contains("paid-user")) {
      if (upgradeMessage) upgradeMessage.innerHTML = "Free accounts are limited to 1,000 characters.";
      return;
    }

    const selectedMode = rewriteMode ? rewriteMode.value.toLowerCase() : "regular";

    let rewritten = originalInput;
    for (let i = 0; i < 4; i++) {
      rewritten = aggressiveHumanize(rewritten, selectedMode);
    }

    if (outputText) outputText.value = rewritten;

    setRewriteCount(currentCount + 1);
    updateRewriteDisplay();
    if (upgradeMessage) upgradeMessage.innerHTML = "";
  });
}

if (inputText) {
  inputText.addEventListener("input", function() {
    updateCharacterDisplay();
  });
}

updateRewriteDisplay();
updateCharacterDisplay();
```

Deploy and test. Numbers should stay intact and it should still score 0%.
