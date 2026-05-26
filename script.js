const FREE_REWRITE_LIMIT = 300;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK = "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";
const PRO_LINK = "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";
const PREMIUM_LINK = "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

document.addEventListener("DOMContentLoaded", function () {
  initializeUsage();

  const input = document.getElementById("inputText");
  const button = document.getElementById("humanizeBtn");
  const copyButton = document.getElementById("copyBtn");

  if (input) {
    input.addEventListener("input", updateUsageDisplay);
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

  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");
  const remaining = Math.max(FREE_REWRITE_LIMIT - currentCount, 0);

  rewriteCount.innerText = `Free rewrites remaining: ${remaining}`;
  charCount.innerText = `${input.value.length.toLocaleString()} characters`;
}

function renderUpgradeOptions(title, description) {
  return `
    <div style="margin-top:20px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;">
      <h3 style="margin-bottom:10px;color:#111827;">${title}</h3>
      <p style="color:#4b5563;line-height:1.6;margin-bottom:18px;">${description}</p>

      <div style="display:grid;gap:12px;">
        <a href="${BASIC_LINK}" style="display:block;text-decoration:none;padding:14px;border-radius:12px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
          <strong>$9/month — Basic</strong><br>
          50 rewrites/month • 5,000 characters
        </a>

        <a href="${PRO_LINK}" style="display:block;text-decoration:none;padding:14px;border-radius:12px;border:2px solid #111827;color:#111827;background:#ffffff;">
          <strong>$19/month — Pro</strong><br>
          250 rewrites/month • 15,000 characters
        </a>

        <a href="${PREMIUM_LINK}" style="display:block;text-decoration:none;padding:14px;border-radius:12px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
          <strong>$39/month — Premium</strong><br>
          Unlimited rewrites • Long-form support
        </a>
      </div>
    </div>
  `;
}

function extractProtectedData(text) {
  const pattern = /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?%?|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi;
  return text.match(pattern) || [];
}

function protectDataBeforeRewrite(text) {
  const items = [];
  const pattern = /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?%?|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi;

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

function aggressiveHumanize(text, mode) {
  let rewritten = text.replace(/\s+/g, " ").trim();

  const sentenceParts = rewritten
    .split(/(?<=[.!?])\s+/)
    .map(function (sentence) {
      return sentence.trim();
    })
    .filter(Boolean);

  const rewrittenSentences = sentenceParts.map(function (sentence, index) {
    let s = sentence;

    s = s.replace(/\bThis shows that\b/gi, "This points to");
    s = s.replace(/\bThis demonstrates that\b/gi, "This points to");
    s = s.replace(/\bThe data shows\b/gi, "The numbers suggest");
    s = s.replace(/\bThe data demonstrates\b/gi, "The numbers suggest");
    s = s.replace(/\bsignificant\b/gi, "meaningful");
    s = s.replace(/\butilize\b/gi, "use");
    s = s.replace(/\bindicates\b/gi, "suggests");
    s = s.replace(/\btherefore\b/gi, "as a result");
    s = s.replace(/\bfurthermore\b/gi, "also");
    s = s.replace(/\bmoreover\b/gi, "also");
    s = s.replace(/\bin conclusion\b/gi, "overall");

    if (index === 0) {
      return s;
    }

    if (index % 4 === 1) {
      return "What stands out is that " + lowerFirstLetter(s);
    }

    if (index % 4 === 2) {
      return "In practical terms, " + lowerFirstLetter(s);
    }

    if (index % 4 === 3) {
      return "That matters because " + lowerFirstLetter(s);
    }

    return s;
  });

  let finalText = rewrittenSentences.join(" ");

  if (mode === "academic") {
    finalText = finalText.replace(/\bshows\b/gi, "suggests");
    finalText = finalText.replace(/\bbig\b/gi, "substantial");
  }

  if (mode === "business" || mode === "executive") {
    finalText = finalText.replace(/\bimportant\b/gi, "material");
    finalText = finalText.replace(/\bproblem\b/gi, "risk");
  }

  if (mode === "plain") {
    finalText = finalText.replace(/\bmaterial\b/gi, "important");
    finalText = finalText.replace(/\bsubstantial\b/gi, "large");
  }

  return finalText;
}

function lowerFirstLetter(text) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function finalCleanup(text) {
  let cleaned = text;

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  cleaned = cleaned.replace(/What stands out is that what stands out is that/gi, "What stands out is that");
  cleaned = cleaned.replace(/In practical terms, in practical terms,/gi, "In practical terms,");
  cleaned = cleaned.replace(/That matters because that matters because/gi, "That matters because");

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
    alert("Tool setup error. Please check that tool.html was replaced correctly.");
    return;
  }

  const originalInput = inputElement.value.trim();
  const rewriteMode = rewriteModeElement.value;
  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");

  if (!originalInput) {
    output.value = "Please paste text first.";
    return;
  }

  if (currentCount >= FREE_REWRITE_LIMIT) {
    output.value = "Free rewrites have been used.";
    upgradeMessage.innerHTML = renderUpgradeOptions(
      "Upgrade Required",
      "Upgrade for larger rewrites and advanced rewrite modes."
    );
    return;
  }

  if (originalInput.length > FREE_CHARACTER_LIMIT) {
    output.value = `Free accounts are limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;
    return;
  }

  upgradeMessage.innerHTML = "";

  const protectedData = protectDataBeforeRewrite(originalInput);

  let humanized = aggressiveHumanize(protectedData.text, rewriteMode);
  humanized = restoreProtectedData(humanized, protectedData.items);
  humanized = finalCleanup(humanized);

  const warning = buildDataWarning(originalInput, humanized);

  output.value = humanized + warning;

  localStorage.setItem("freeRewriteCount", String(currentCount + 1));
  updateUsageDisplay();
}

function copyOutputText() {
  const output = document.getElementById("outputText");

  if (!output || !output.value.trim()) {
    return;
  }

  navigator.clipboard.writeText(output.value);
}
