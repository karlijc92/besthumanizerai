const FREE_REWRITE_LIMIT = 3;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK = "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";
const PRO_LINK = "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";
const PREMIUM_LINK = "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

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
        "Upgrade your account for larger rewrites and advanced rewrite modes."
      );

    return;
  }

  upgradeMessage.innerHTML = "";

  const protectedValues =
    protectCriticalData(originalInput);

  let workingText =
    protectedValues.text;

  for (let i = 0; i < 4; i++) {

    workingText =
      deepHumanize(
        workingText,
        rewriteMode
      );
  }

  workingText =
    restoreCriticalData(
      workingText,
      protectedValues.map
    );

  workingText =
    cleanupOutput(
      workingText
    );

  output.innerText =
    workingText;

  localStorage.setItem(
    "freeRewriteCount",
    String(currentCount + 1)
  );

  updateUsageDisplay();
}

function protectCriticalData(text) {

  const protectedMap = [];

  let protectedText = text;

  const patterns = [

    /\$?\d+(?:,\d{3})*(?:\.\d+)?%?/g,

    /\b(?:19|20)\d{2}\b/g,

    /\b[A-Z]{2,5}\b/g,

    /\([A-Za-z]+,\s?\d{4}\)/g
  ];

  patterns.forEach(pattern => {

    protectedText =
      protectedText.replace(pattern, match => {

        const token =
          `__PROTECTED_${protectedMap.length}__`;

        protectedMap.push({
          token,
          value: match
        });

        return token;
      });
  });

  return {
    text: protectedText,
    map: protectedMap
  };
}

function restoreCriticalData(text, protectedMap) {

  let restored = text;

  protectedMap.forEach(item => {

    restored =
      restored.replaceAll(
        item.token,
        item.value
      );
  });

  return restored;
}

function deepHumanize(text, mode) {

  let rewritten =
    text.replace(/\s+/g, " ").trim();

  const replacements = [

    ["reported revenue growth", "experienced stronger revenue performance"],
    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "fairly meaningful"],
    ["therefore", "because of this"],
    ["however", "even so"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["the company", "the business"],
    ["operating expenses", "operating costs"],
    ["net income", "profitability"],
    ["gross margin", "margin performance"],
    ["customer retention", "repeat customer activity"],
    ["free cash flow", "available cash generation"]
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

  const starters = [

    "What stands out here is that",
    "Looking deeper into the numbers,",
    "One important thing to notice is that",
    "From a broader perspective,",
    "Another factor worth mentioning is that",
    "A closer look also shows that",
    "Interestingly,",
    "At the same time,"
  ];

  let usedStarters = [];

  sentences = sentences.map((sentence, index) => {

    if (sentence.length < 18) {
      return sentence;
    }

    if (Math.random() > 0.45) {

      sentence =
        sentence.replace(
          /, while/gi,
          ". Meanwhile,"
        );

      sentence =
        sentence.replace(
          /, because/gi,
          ". This happened because"
        );

      sentence =
        sentence.replace(
          /, and/gi,
          ". Also,"
        );
    }

    if (
      index !== 0 &&
      Math.random() > 0.5
    ) {

      let available =
        starters.filter(
          item =>
            !usedStarters.includes(item)
        );

      if (available.length === 0) {

        usedStarters = [];

        available = starters;
      }

      const selected =
        available[
          Math.floor(
            Math.random() * available.length
          )
        ];

      usedStarters.push(selected);

      sentence =
        selected +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    if (
      sentence.length > 100 &&
      Math.random() > 0.45
    ) {

      const midpoint =
        Math.floor(sentence.length / 2);

      const splitPoint =
        sentence.indexOf(",", midpoint);

      if (splitPoint !== -1) {

        sentence =
          sentence.slice(0, splitPoint) +
          "." +
          sentence.slice(splitPoint + 1);
      }
    }

    return sentence;

  });

  if (sentences.length > 3) {

    const moved =
      sentences.splice(0, 1)[0];

    sentences.splice(2, 0, moved);
  }

  if (sentences.length > 5) {

    const movedSecond =
      sentences.splice(4, 1)[0];

    sentences.splice(1, 0, movedSecond);
  }

  rewritten =
    sentences.join(" ");

  rewritten =
    rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /Interestingly,/gi,
        "Importantly,"
      );

    rewritten =
      rewritten.replace(
        /What stands out here is that/gi,
        "The findings suggest that"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /What stands out here is that/gi,
        "From a business standpoint,"
      );

    rewritten =
      rewritten.replace(
        /From a broader perspective,/gi,
        "Operationally,"
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
        /Interestingly,/gi,
        "Notably,"
      );
  }

  return rewritten;
}

function cleanupOutput(text) {

  let cleaned =
    text;

  const repetitivePhrases = [

    "What stands out here is that",
    "Looking deeper into the numbers,",
    "One important thing to notice is that",
    "From a broader perspective,",
    "Another factor worth mentioning is that",
    "A closer look also shows that",
    "Interestingly,",
    "At the same time,"
  ];

  repetitivePhrases.forEach(phrase => {

    const regex =
      new RegExp(
        phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
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

  return cleaned;
}
