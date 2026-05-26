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
    button.addEventListener("click", humanizeText);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyOutputText);
  }
});

function initializeUsage() {
  if (!localStorage.getItem("freeRewriteCount")) {
    localStorage.setItem("freeRewriteCount", "0");
  }

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

function aggressiveHumanize(text, mode) {
  let sentences = splitSentences(text);

  if (sentences.length === 0) return "";

  const openers = [
    "What matters here is that",
    "The bigger point is that",
    "From a practical standpoint,",
    "The useful takeaway is that",
    "Looking at the numbers,",
    "This matters because",
    "In plain terms,",
    "The result is important because"
  ];

  const softenedVerbs = [
    ["demonstrates", "points to"],
    ["demonstrate", "point to"],
    ["indicates", "suggests"],
    ["indicate", "suggest"],
    ["illustrates", "shows"],
    ["utilizes", "uses"],
    ["utilize", "use"],
    ["significant", "meaningful"],
    ["substantial", "large"],
    ["therefore", "as a result"],
    ["furthermore", "also"],
    ["moreover", "also"],
    ["overall,", ""],
    ["in conclusion,", ""]
  ];

  let rewritten = sentences.map(function (sentence, index) {
    let s = sentence;

    softenedVerbs.forEach(function (pair) {
      const regex = new RegExp("\\b" + pair[0] + "\\b", "gi");
      s = s.replace(regex, pair[1]);
    });

    s = s.replace(/^The company /i, "The business ");
    s = s.replace(/^The data /i, "The numbers ");
    s = s.replace(/^This shows that /i, "This points to ");
    s = s.replace(/^This suggests that /i, "This points to ");

    if (index === 0) {
      return s;
    }

    const opener = openers[index % openers.length];

    if (index % 3 === 1) {
      return `${opener} ${lowerFirstLetter(s)}`;
    }

    if (index % 3 === 2) {
      return `${s} That shift gives the paragraph a more grounded, less mechanical feel.`;
    }

    return s;
  });

  let result = rewritten.join(" ");

  result = restructureParagraph(result, mode);

  return result;
}

function restructureParagraph(text, mode) {
  let result = text;

  result = result.replace(
    /\bRevenue\b/gi,
    mode === "business" || mode === "executive" ? "Sales" : "Revenue"
  );

  result = result.replace(
    /\bnet income improved\b/gi,
    "net income moved higher"
  );

  result = result.replace(
    /\boperating margin expanded\b/gi,
    "operating margin widened"
  );

  result = result.replace(
    /\bwhich suggests\b/gi,
    "which points to"
  );

  if (mode === "academic") {
    result = result.replace(/\bbig\b/gi, "meaningful");
    result = result.replace(/\bshows\b/gi, "suggests");
  }

  if (mode === "plain") {
    result = result.replace(/\bmaterial\b/gi, "important");
    result = result.replace(/\bmeaningful\b/gi, "important");
  }

  return result;
}

function lowerFirstLetter(text) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function finalCleanup(text) {
  let cleaned = text;

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  cleaned = cleaned.replace(/What matters here is that what matters here is that/gi, "What matters here is that");
  cleaned = cleaned.replace(/The bigger point is that the bigger point is that/gi, "The bigger point is that");
  cleaned = cleaned.replace(/From a practical standpoint, from a practical standpoint,/gi, "From a practical standpoint,");
  cleaned = cleaned.replace(/This matters because this matters because/gi, "This matters because");

  cleaned = cleaned.replace(/\s+([.,!?])/g, "$1");
  cleaned = cleaned.replace(/\.\s+That shift gives the paragraph a more grounded, less mechanical feel\.\s+That shift gives the paragraph a more grounded, less mechanical feel\./gi, ".");

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
    alert("Tool setup error. Please check tool.html and script.js.");
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

  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");
  localStorage.setItem("freeRewriteCount", String(currentCount + 1));

  updateUsageDisplay();
}

function copyOutputText() {
  const output = document.getElementById("outputText");

  if (!output || !output.value.trim()) return;

  navigator.clipboard.writeText(output.value);
}
