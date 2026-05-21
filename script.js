const FREE_REWRITE_LIMIT = 3;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK = "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";
const PRO_LINK = "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";
const PREMIUM_LINK = "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

let lastHumanizedText = "";

initializeUsage();

function initializeUsage() {

  if (!localStorage.getItem("freeRewriteCount")) {
    localStorage.setItem("freeRewriteCount", "0");
  }

  updateUsageDisplay();
}

function updateUsageDisplay() {

  const input =
    document.getElementById("inputText");

  const rewriteCounter =
    document.getElementById("rewriteCounter");

  const characterCounter =
    document.getElementById("characterCounter");

  if (!input || !rewriteCounter || !characterCounter) {
    return;
  }

  const currentCount =
    parseInt(
      localStorage.getItem("freeRewriteCount") || "0"
    );

  const remaining =
    FREE_REWRITE_LIMIT - currentCount;

  rewriteCounter.innerText =
    `Free rewrites remaining: ${Math.max(remaining, 0)}`;

  characterCounter.innerText =
    `${input.value.length.toLocaleString()} / ${FREE_CHARACTER_LIMIT.toLocaleString()} characters`;
}

function renderUpgradeOptions(title, description) {

  return `
    <div style="margin-top:24px;padding:24px;border-radius:20px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 12px 35px rgba(15,23,42,0.08);">

      <h3 style="margin-bottom:12px;color:#111827;font-size:28px;">
        ${title}
      </h3>

      <p style="color:#4b5563;line-height:1.7;margin-bottom:24px;">
        ${description}
      </p>

      <div style="display:grid;gap:16px;">

        <a href="${BASIC_LINK}"
          style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
          <strong>$9/month — Basic</strong><br>
          50 rewrites/month • 5,000 characters
        </a>

        <a href="${PRO_LINK}"
          style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:2px solid #111827;color:#111827;background:#ffffff;">
          <strong>$19/month — Pro</strong><br>
          250 rewrites/month • 15,000 characters
        </a>

        <a href="${PREMIUM_LINK}"
          style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
          <strong>$39/month — Premium</strong><br>
          Unlimited rewrites • Long-form support
        </a>

      </div>
    </div>
  `;
}

function protectData(text) {

  const items = [];

  const dataPattern =
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?%?|\b(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi;

  const protectedText =
    text.replace(dataPattern, function(match) {

      const token =
        `__DATA_${items.length}__`;

      items.push({
        token,
        value: match
      });

      return token;
    });

  return {
    text: protectedText,
    items
  };
}

function restoreData(text, items) {

  let restored =
    text;

  items.forEach(item => {

    restored =
      restored.replaceAll(
        item.token,
        item.value
      );
  });

  return restored;
}

function cleanFinalText(text) {

  let cleaned =
    text;

  const repeatedPhrases = [

    "What stands out is that",
    "Looking at the numbers,",
    "One detail that matters is that",
    "The bigger picture is that",
    "A closer look shows that",
    "At the same time,",
    "Another point worth noting is that",
    "From a practical standpoint,",
    "From a business standpoint,",
    "Operationally,",
    "Notably,"
  ];

  repeatedPhrases.forEach(phrase => {

    const regex =
      new RegExp(
        phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );

    let count = 0;

    cleaned =
      cleaned.replace(regex, match => {

        count++;

        if (count > 1) {
          return "";
        }

        return match;
      });
  });

  cleaned =
    cleaned.replace(/\s+/g, " ").trim();

  cleaned =
    cleaned.replace(/\.\s+\./g, ".");

  cleaned =
    cleaned.replace(/\s+,/g, ",");

  cleaned =
    cleaned.replace(/\s+\./g, ".");

  cleaned =
    cleaned.replace(/,\s*,/g, ",");

  cleaned =
    cleaned.replace(/\s+%/g, "%");

  return cleaned;
}

function humanizeText() {

  const inputElement =
    document.getElementById("inputText");

  const output =
    document.getElementById("outputText");

  const rewriteMode =
    document.getElementById("rewriteMode").value;

  const upgradeMessage =
    document.getElementById("upgradeMessage");

  const currentCount =
    parseInt(
      localStorage.getItem("freeRewriteCount") || "0"
    );

  const originalInput =
    inputElement.value.trim();

  if (currentCount >= FREE_REWRITE_LIMIT) {

    output.innerText =
      "Free rewrites have been used.";

    upgradeMessage.innerHTML =
      renderUpgradeOptions(
        "Upgrade Required",
        "Upgrade for larger rewrites, advanced modes, and long-form humanization."
      );

    return;
  }

  if (!originalInput) {

    output.innerText =
      "Please paste text first.";

    return;
  }

  if (originalInput.length > FREE_CHARACTER_LIMIT) {

    output.innerText =
      `Free accounts are limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;

    upgradeMessage.innerHTML =
      renderUpgradeOptions(
        "Need More Characters?",
        "Upgrade your account for larger rewrites and advanced rewrite modes."
      );

    return;
  }

  upgradeMessage.innerHTML = "";

  const protectedData =
    protectData(originalInput);

  let humanized =
    protectedData.text;

  for (let i = 0; i < 4; i++) {

    humanized =
      aggressiveHumanize(
        humanized,
        rewriteMode
      );
  }

  humanized =
    restoreData(
      humanized,
      protectedData.items
    );

  humanized =
    cleanFinalText(
      humanized
    );

  lastHumanizedText =
    humanized;

  output.innerText =
    humanized;

  localStorage.setItem(
    "freeRewriteCount",
    String(currentCount + 1)
  );

  updateUsageDisplay();
}
