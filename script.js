const FREE_REWRITE_LIMIT = 30;
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
        "Upgrade your account for larger rewrites, advanced modes, and higher monthly limits."
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

function protectData(text) {

  const items = [];

  const protectedPatterns = [

    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)/gi,

    /\d+(?:\.\d+)?%\s?(?:increase|decrease|growth|decline|rise|drop)?/gi,

    /(?:operating income|net income|gross margin|free cash flow|operating expenses|research and development expenses|earnings per share|revenue|cloud revenue)\s(?:rose|increased|declined|grew|climbed|reached)\s(?:to\s)?\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi,

    /\b(?:19|20)\d{2}\b/g,

    /\([A-Za-z]+,\s?\d{4}\)/g
  ];

  let protectedText = text;

  protectedPatterns.forEach(pattern => {

    protectedText =
      protectedText.replace(pattern, function(match) {

        const token =
          `__DATA_${items.length}__`;

        items.push({
          token,
          value: match
        });

        return token;
      });
  });

  return {
    text: protectedText,
    items
  };
}

function restoreData(text, items) {

  let restored = text;

  items.forEach(item => {

    restored =
      restored.replaceAll(
        item.token,
        item.value
      );
  });

  return restored;
}

function aggressiveHumanize(text, mode) {

  let rewritten =
    text.replace(/\s+/g, " ").trim();

  const replacements = [

    ["reported revenue growth", "showed stronger revenue performance"],
    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["therefore", "because of this"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["during the same period", "around the same time"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["net income", "profitability"],
    ["operating expenses", "operating costs"],
    ["gross margin", "margin performance"],
    ["free cash flow", "available cash flow"],
    ["the company", "the business"]
  ];

  replacements.forEach(pair => {

    rewritten =
      rewritten.replace(
        new RegExp(pair[0], "gi"),
        pair[1]
      );
  });

  let sentences =
    rewritten
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);

  const softStarters = [

    "What stands out is that",
    "Looking at the numbers,",
    "One detail that matters is that",
    "The bigger picture is that",
    "A closer look shows that",
    "At the same time,",
    "Another point worth noting is that",
    "From a practical standpoint,"
  ];

  let usedStarters = [];

  sentences = sentences.map((sentence, index) => {

    if (sentence.length < 20) {
      return sentence;
    }

    if (
      sentence.length > 120 &&
      !sentence.includes("__DATA_")
    ) {

      sentence =
        sentence.replace(/, while/gi, ". Meanwhile,");

      sentence =
        sentence.replace(/, because/gi, ". This happened because");

      sentence =
        sentence.replace(/, and/gi, ". Also,");
    }

    if (
      index !== 0 &&
      Math.random() > 0.62
    ) {

      let available =
        softStarters.filter(
          starter =>
            !usedStarters.includes(starter)
        );

      if (available.length === 0) {

        available = softStarters;

        usedStarters = [];
      }

      const starter =
        available[
          Math.floor(
            Math.random() * available.length
          )
        ];

      usedStarters.push(starter);

      sentence =
        starter +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    return sentence;
  });

  if (sentences.length > 3) {

    const first =
      sentences.splice(0, 1)[0];

    sentences.splice(2, 0, first);
  }

  rewritten =
    sentences.join(" ");

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /What stands out is that/gi,
        "The findings suggest that"
      );

    rewritten =
      rewritten.replace(
        /Looking at the numbers,/gi,
        "From an analytical standpoint,"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /What stands out is that/gi,
        "From a business standpoint,"
      );
  }

  if (mode === "resume") {

    rewritten =
      rewritten.replace(
        /\bthe business\b/gi,
        "the organization"
      );
  }

  if (mode === "data-safe") {

    rewritten =
      rewritten.replace(
        /What stands out is that/gi,
        "Notably,"
      );
  }

  return rewritten.replace(/\s+/g, " ").trim();
}

function cleanFinalText(text) {

  let cleaned = text;

  cleaned =
    cleaned.replace(
      /What stands out is that\s+one detail that matters is that/gi,
      "What stands out is that"
    );

  cleaned =
    cleaned.replace(
      /Looking at the numbers,\s+a closer look shows that/gi,
      "A closer look shows that"
    );

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
