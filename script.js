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
  const input = document.getElementById("inputText");
  const rewriteCounter = document.getElementById("rewriteCounter");
  const characterCounter = document.getElementById("characterCounter");

  if (!input || !rewriteCounter || !characterCounter) {
    return;
  }

  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");
  const remaining = FREE_REWRITE_LIMIT - currentCount;

  rewriteCounter.innerText =
    `Free rewrites remaining: ${Math.max(remaining, 0)}`;

  characterCounter.innerText =
    `${input.value.length.toLocaleString()} / ${FREE_CHARACTER_LIMIT.toLocaleString()} characters`;
}

function renderUpgradeOptions(title, description) {
  return `
    <div style="margin-top:24px;padding:24px;border-radius:20px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 12px 35px rgba(15,23,42,0.08);">
      <h3 style="margin-bottom:12px;color:#111827;font-size:28px;">${title}</h3>

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

  const inputElement = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  const rewriteMode = document.getElementById("rewriteMode").value;
  const upgradeMessage = document.getElementById("upgradeMessage");

  const currentCount =
    parseInt(localStorage.getItem("freeRewriteCount") || "0");

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
      deepHumanize(workingText, rewriteMode);
  }

  workingText =
    restoreCriticalData(
      workingText,
      protectedValues.map
    );

  workingText =
    cleanupRepetition(workingText);

  lastHumanizedText =
    workingText;

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

  const phraseSwaps = [

    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["therefore", "because of this"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["the company", "the business"]
  ];

  phraseSwaps.forEach(pair => {

    rewritten =
      rewritten.replace(
        new RegExp(pair[0], "gi"),
        pair[1]
      );
  });

  let sentences =
    rewritten
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

  const starters = [

    "One important point is that",
    "Looking at the broader picture,",
    "Another detail worth noticing is that",
    "From a practical standpoint,",
    "What becomes clear here is that",
    "A key takeaway is that"
  ];

  let usedStarters = [];

  sentences =
    sentences.map((sentence, index) => {

      if (sentence.length < 25) {
        return sentence;
      }

      if (
        index !== 0 &&
        Math.random() > 0.55
      ) {

        let available =
          starters.filter(
            starter =>
              !usedStarters.includes(starter)
          );

        if (available.length === 0) {
          usedStarters = [];
          available = starters;
        }

        const chosen =
          available[
            Math.floor(
              Math.random() * available.length
            )
          ];

        usedStarters.push(chosen);

        sentence =
          chosen +
          " " +
          sentence.charAt(0).toLowerCase() +
          sentence.slice(1);
      }

      if (
        sentence.length > 140 &&
        Math.random() > 0.4
      ) {

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

      return sentence;
    });

  if (sentences.length > 4) {

    const movedSentence =
      sentences.splice(0, 1)[0];

    sentences.splice(2, 0, movedSentence);
  }

  rewritten =
    sentences.join(" ");

  rewritten =
    rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /Looking at the broader picture,/gi,
        "Importantly,"
      );

    rewritten =
      rewritten.replace(
        /A key takeaway is that/gi,
        "The findings suggest that"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /What becomes clear here is that/gi,
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
        /A key takeaway is that/gi,
        "Notably,"
      );
  }

  return rewritten;
}

function cleanupRepetition(text) {

  const repetitivePhrases = [

    "Looking at the broader picture,",
    "One important point is that",
    "Another detail worth noticing is that",
    "What becomes clear here is that",
    "A key takeaway is that",
    "From a practical standpoint,"
  ];

  let cleaned = text;

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

  return cleaned;
}
