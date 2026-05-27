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
  var used = getRewriteCount();
  rewriteCount.textContent = used + " / " + FREE_REWRITES + " Free Rewrites Used";
}

function updateCharacterDisplay() {
  var count = inputText.value.length;
  characterCount.textContent = count + " / " + FREE_CHARACTER_LIMIT + " Characters";
}

function protectNumbers(text) {
  var items = [];
  var result = text.replace(/(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?%?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b)/gi, function(match) {
    items.push(match);
    return "PROTECT" + (items.length - 1) + "END";
  });
  return { result: result, items: items };
}

function restoreNumbers(text, items) {
  var result = text.replace(/PROTECT(\d+)END/g, function(match, index) {
    return items[parseInt(index)] || match;
  });
  result = result.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  result = result.replace(/(\d),\s+(\d)/g, "$1,$2");
  return result;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleSentences(text) {
  var sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length < 2) {
    return text;
  }
  for (var i = sentences.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = sentences[i];
    sentences[i] = sentences[j];
    sentences[j] = temp;
  }
  return sentences.join(" ");
}

function rewriteSentence(sentence, mode) {
  var replacements = {
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

  var rewritten = sentence;

  Object.keys(replacements).forEach(function(word) {
    var regex = new RegExp("\\b" + word + "\\b", "gi");
    rewritten = rewritten.replace(regex, function() {
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

  var numData = protectNumbers(text);
  var protectedText = numData.result;
  var items = numData.items;

  var rewritten = protectedText.trim().replace(/\s+/g, " ");

  var sentences = rewritten.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    rewritten = sentences.map(function(sentence) {
      return rewriteSentence(sentence, mode);
    }).join(" ");
  }

  rewritten = shuffleSentences(rewritten);
  rewritten = restoreNumbers(rewritten, items);

  return rewritten;
}

humanizeBtn.addEventListener("click", function() {
  var currentCount = getRewriteCount();

  var originalInput = outputText.value.trim() !== "" ? outputText.value.trim() : inputText.value.trim();

  if (!originalInput) {
    alert("Please enter text to humanize.");
    return;
  }

  if (currentCount >= FREE_REWRITES && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML = "You have reached the free rewrite limit. Please upgrade to continue.";
    return;
  }

  if (originalInput.length > FREE_CHARACTER_LIMIT && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML = "Free accounts are limited to 1,000 characters.";
    return;
  }

  var selectedMode = rewriteMode ? rewriteMode.value.toLowerCase() : "regular";

  var rewritten = originalInput;
  for (var i = 0; i < 4; i++) {
    rewritten = aggressiveHumanize(rewritten, selectedMode);
  }

  lastHumanizedText = rewritten;
  outputText.value = rewritten;
  setRewriteCount(currentCount + 1);
  updateRewriteDisplay();
  upgradeMessage.innerHTML = "";
});

inputText.addEventListener("input", function() {
  updateCharacterDisplay();
});

updateRewriteDisplay();
updateCharacterDisplay();V
