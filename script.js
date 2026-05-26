const FREE_REWRITE_LIMIT = 999999;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK = "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";
const PRO_LINK = "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";
const PREMIUM_LINK = "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

let lastHumanizedText = "";

document.addEventListener("DOMContentLoaded", function () {
  initializeUsage();

  const input = document.getElementById("inputText");
  const button = document.getElementById("humanizeBtn");
  const copyButton = document.getElementById("copyBtn");

  if (input) {
    input.addEventListener("input", function () {
      lastHumanizedText = "";
      updateUsageDisplay();
    });
  }

  if (button) {
    button.onclick = humanizeText;
  }

  if (copyButton) {
    copyButton.onclick = copyOutputText;
  }
});

function initializeUsage() {
  updateUsageDisplay();
}

function updateUsageDisplay() {
  const input = document.getElementById("inputText");
  const rewriteCount = document.getElementById("rewriteCount");
  const charCount = document.getElementById("charCount");

  if (!input || !rewriteCount || !charCount) return;

  rewriteCount.innerText = "Testing mode: unlimited rewrites";
  charCount.innerText = `${input.value.length.toLocaleString()} characters`;
}

function extractProtectedData(text) {
  const pattern =
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?%?|\b\d+(?:\.\d+)?%|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi;

  return text.match(pattern) || [];
}

function protectDataBeforeRewrite(text) {
  const items = [];

  const pattern =
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?%?|\b\d+(?:\.\d+)?%|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi;

  const protectedText = text.replace(pattern, function (match) {
    const token = `__DATA_${items.length}__`;
    items.push({ token, value: match });
    return token;
  });

  return { text: protectedText, items };
}

function restoreProtectedData(text, items) {
  let restored = text;

  items.forEach(function (item) {
    restored = restored.split(item.token).join(item.value);
  });

  return restored;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map(function (sentence) {
      return sentence.trim();
    })
    .filter(Boolean);
}

function lowerFirstLetter(text) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function aggressiveHumanize(text, mode) {
  let working = text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["demonstrates", "points to"],
    ["demonstrate", "point to"],
    ["indicates", "suggests"],
    ["indicate", "suggest"],
    ["illustrates", "shows"],
    ["utilizes", "uses"],
    ["utilize", "use"],
    ["significant", "meaningful"],
    ["therefore", "because of this"],
    ["furthermore", "also"],
    ["moreover", "also"],
    ["the data", "the numbers"],
    ["the company", "the business"],
    ["net income improved", "net income moved higher"],
    ["operating margin expanded", "operating margin widened"],
    ["customer retention improved", "customer retention climbed"],
    ["which suggests", "which points to"],
    ["representing a", "which amounted to a"],
    ["year over year", "compared with the prior year"]
  ];

  replacements.forEach(function (pair) {
    const regex = new RegExp("\\b" + pair[0] + "\\b", "gi");
    working = working.replace(regex, pair[1]);
  });

  let sentences = splitSentences(working);

  const openers = [
    "What stands out is that",
    "From a practical standpoint,",
    "The larger takeaway is that",
    "In plain terms,",
    "The important part is that",
    "From an operating perspective,",
    "The numbers matter because",
    "A closer look shows that"
  ];

  const rebuilt = sentences.map(function (sentence, index) {
    let s = sentence.trim();

    if (index === 0) {
      return s;
    }

    if (index % 3 === 1) {
      return openers[index % openers.length] + " " + lowerFirstLetter(s);
    }

    if (index % 3 === 2 && s.length > 120) {
      const parts = s.split(",");

      if (parts.length >= 3) {
        const first = parts.slice(0, 2).join(",").trim();
        const second = parts.slice(2).join(",").trim();
        return first + ". " + capitalizeFirst(second);
      }
    }

    return s;
  });

  let result = rebuilt.join(" ");

  if (mode === "academic") {
    result = result.replace(/\bshows\b/gi, "suggests");
    result = result.replace(/\bmeaningful\b/gi, "substantial");
  }

  if (mode === "business" || mode === "executive") {
    result = result.replace(/\bimportant\b/gi, "material");
    result = result.replace(/\bproblem\b/gi, "risk");
  }

  if (mode === "plain") {
    result = result.replace(/\bsubstantial\b/gi, "large");
    result = result.replace(/\bmaterial\b/gi, "important");
  }

  return finalCleanup(result);
}

function finalCleanup(text) {
  let cleaned = text.replace(/\s+/g, " ").trim();

  cleaned = cleaned.replace(/What stands out is that what stands out is that/gi, "What stands out is that");
  cleaned = cleaned.replace(/From a practical standpoint, from a practical standpoint,/gi, "From a practical standpoint,");
  cleaned = cleaned.replace(/The larger takeaway is that the larger takeaway is that/gi, "The larger takeaway is that");
  cleaned = cleaned.replace(/In plain terms, in plain terms,/gi, "In plain terms,");
  cleaned = cleaned.replace(/The important part is that the important part is that/gi, "The important part is that");
  cleaned = cleaned.replace(/From an operating perspective, from an operating perspective,/gi, "From an operating perspective,");
  cleaned = cleaned.replace(/The numbers matter because the numbers matter because/gi, "The numbers matter because");
  cleaned = cleaned.replace(/A closer look shows that a closer look shows that/gi, "A closer look shows that");

  cleaned = cleaned.replace(/\s+([.,!?])/g, "$1");

  return cleaned;
}

function buildDataWarning(originalText, finalText) {
  const originalData = extractProtectedData(originalText);
  const finalData = extractProtectedData(finalText);

  const missingItems = originalData.filter(function (item) {
    return !finalData.includes(item);
  });

  if (missingItems.length > 0) {
    return "\n\nDATA CHECK WARNING: Possible number mismatch found.";
  }

  return "";
}

function humanizeText() {
  const inputElement = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  const rewriteModeElement = document.getElementById("rewriteMode");
  const upgradeMessage = document.getElementById("upgradeMessage");

  if (!inputElement || !output || !rewriteModeElement || !upgradeMessage) {
    alert("Tool setup error. Check that tool.html has inputText, outputText, rewriteMode, and upgradeMessage.");
    return;
  }

  const typedInput = inputElement.value.trim();
  const rewriteMode = rewriteModeElement.value;

  if (!typedInput) {
    output.value = "Please paste text first.";
    return;
  }

  if (typedInput.length > FREE_CHARACTER_LIMIT) {
    output.value = `Free testing is limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;
    return;
  }

  upgradeMessage.innerHTML = "";

  const textToRewrite = lastHumanizedText || typedInput;

  const protectedData = protectDataBeforeRewrite(textToRewrite);

  let humanized = aggressiveHumanize(protectedData.text, rewriteMode);
  humanized = restoreProtectedData(humanized, protectedData.items);
  humanized = finalCleanup(humanized);

  const warning = buildDataWarning(typedInput, humanized);

  output.value = humanized + warning;
  lastHumanizedText = humanized;

  updateUsageDisplay();
}

function copyOutputText() {
  const output = document.getElementById("outputText");

  if (!output || !output.value.trim()) return;

  navigator.clipboard.writeText(output.value);
}
