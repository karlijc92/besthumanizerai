const FREE_CHARACTER_LIMIT = 1000;

let lastHumanizedText = "";

document.addEventListener("DOMContentLoaded", function () {
  initializeTool();
});

function initializeTool() {
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

  updateUsageDisplay();
}

function updateUsageDisplay() {
  const input = document.getElementById("inputText");
  const rewriteCount = document.getElementById("rewriteCount");
  const charCount = document.getElementById("charCount");

  if (rewriteCount) {
    rewriteCount.innerText = "Testing mode: unlimited rewrites";
  }

  if (input && charCount) {
    charCount.innerText = `${input.value.length.toLocaleString()} characters`;
  }
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

function finalCleanup(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
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
    alert("Tool setup error. Please check the page files.");
    return;
  }

  if (typeof aggressiveHumanize !== "function") {
    output.value = "Engine error: engine.js is not loading.";
    return;
  }

  const originalInput = inputElement.value.trim();
  const rewriteMode = rewriteModeElement.value;

  if (!originalInput) {
    output.value = "Please paste text first.";
    return;
  }

  if (originalInput.length > FREE_CHARACTER_LIMIT) {
    output.value = `Free testing is limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;
    return;
  }

  upgradeMessage.innerHTML = "";

  const textToRewrite = lastHumanizedText || originalInput;
  const protectedData = protectDataBeforeRewrite(textToRewrite);

  let humanized = aggressiveHumanize(protectedData.text, rewriteMode);
  humanized = restoreProtectedData(humanized, protectedData.items);
  humanized = finalCleanup(humanized);

  const warning = buildDataWarning(originalInput, humanized);

  output.value = humanized + warning;
  lastHumanizedText = humanized;

  updateUsageDisplay();
}

function copyOutputText() {
  const output = document.getElementById("outputText");

  if (!output || !output.value.trim()) return;

  navigator.clipboard.writeText(output.value);
}
