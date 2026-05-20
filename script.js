const FREE_REWRITE_LIMIT = 3;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK =
  "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";

const PRO_LINK =
  "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";

const PREMIUM_LINK =
  "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

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
    <div style="
      margin-top:24px;
      padding:24px;
      border-radius:20px;
      background:#ffffff;
      border:1px solid #e5e7eb;
      box-shadow:0 12px 35px rgba(15,23,42,0.08);
    ">

      <h3 style="
        margin-bottom:12px;
        color:#111827;
        font-size:28px;
      ">
        ${title}
      </h3>

      <p style="
        color:#4b5563;
        line-height:1.7;
        margin-bottom:24px;
      ">
        ${description}
      </p>

      <div style="display:grid;gap:16px;">

        <a href="${BASIC_LINK}" style="
          display:block;
          text-decoration:none;
          padding:16px 18px;
          border-radius:14px;
          border:1px solid #d1d5db;
          color:#111827;
          background:#f9fafb;
        ">
          <strong>$9/month — Basic</strong><br>
          50 rewrites/month • 5,000 characters
        </a>

        <a href="${PRO_LINK}" style="
          display:block;
          text-decoration:none;
          padding:16px 18px;
          border-radius:14px;
          border:2px solid #111827;
          color:#111827;
          background:#ffffff;
        ">
          <strong>$19/month — Pro</strong><br>
          250 rewrites/month • 15,000 characters
        </a>

        <a href="${PREMIUM_LINK}" style="
          display:block;
          text-decoration:none;
          padding:16px 18px;
          border-radius:14px;
          border:1px solid #d1d5db;
          color:#111827;
          background:#f9fafb;
        ">
          <strong>$39/month — Premium</strong><br>
          Unlimited rewrites • Long-form support
        </a>

      </div>
    </div>
  `;
}

function humanizeText() {

  const input =
    document.getElementById("inputText").value;

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

  if (currentCount >= FREE_REWRITE_LIMIT) {

    output.innerText =
      "Free rewrites have been used.";

    upgradeMessage.innerHTML =
      renderUpgradeOptions(
        "Upgrade Required",
        "Your free rewrites have been used. Upgrade now to continue humanizing longer reports, business writing, resumes, and academic work."
      );

    return;
  }

  if (input.trim() === "") {

    output.innerText =
      "Please paste text first.";

    return;
  }

  if (input.length > FREE_CHARACTER_LIMIT) {

    output.innerText =
      `Free accounts are limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;

    upgradeMessage.innerHTML =
      renderUpgradeOptions(
        "Need More Characters?",
        "Upgrade your account for larger rewrites, advanced modes, and higher monthly rewrite limits."
      );

    return;
  }

  upgradeMessage.innerHTML = "";

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized = input;

  for (let i = 0; i < 5; i++) {
    humanized =
      deepHumanize(humanized, rewriteMode);
  }

  const newNumbers =
    humanized.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  const originalSorted =
    [...originalNumbers].sort();

  const newSorted =
    [...newNumbers].sort();

  let warningText = "";

  if (
    JSON.stringify(originalSorted) !==
    JSON.stringify(newSorted)
  ) {

    warningText =
      "⚠ Possible number mismatch detected.\n\n";
  }

  output.innerText =
    warningText + humanized;

  localStorage.setItem(
    "freeRewriteCount",
    String(currentCount + 1)
  );

  updateUsageDisplay();
}

function deepHumanize(text, mode) {

  let rewritten =
    text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["reported revenue growth", "experienced stronger revenue performance"],
    ["Operating expenses rose", "Operating costs increased"],
    ["net income improved", "profitability improved"],
    ["Customer retention increased", "customer retention became stronger"],
    ["average order value climbed", "average order value moved higher"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["primarily", "mostly"],
    ["however", "still"],
    ["therefore", "because of this"]
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

  sentences = sentences.map(sentence => {

    if (sentence.length > 120) {

      sentence =
        sentence.replace(/, while/gi, ". Meanwhile,");

      sentence =
        sentence.replace(/, and/gi, ". In addition,");

      sentence =
        sentence.replace(/, because/gi, ". This occurred because");
    }

    if (Math.random() > 0.45) {

      sentence =
        sentence.replace(
          /\bthe company\b/gi,
          "the business"
        );
    }

    if (Math.random() > 0.6) {

      sentence =
        sentence.replace(
          /\bthe business\b/gi,
          "the organization"
        );
    }

    return sentence;

  });

  if (sentences.length > 4) {

    const movedFirst =
      sentences.splice(0, 1)[0];

    sentences.splice(3, 0, movedFirst);
  }

  if (sentences.length > 5) {

    const movedSecond =
      sentences.splice(2, 1)[0];

    sentences.push(movedSecond);
  }

  if (sentences.length > 6) {

    const movedThird =
      sentences.splice(1, 1)[0];

    sentences.splice(4, 0, movedThird);
  }

  rewritten =
    sentences.join(" ");

  rewritten =
    rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /\bshows\b/gi,
        "illustrates"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /\bimproved\b/gi,
        "strengthened"
      );
  }

  if (mode === "resume") {

    rewritten =
      rewritten.replace(
        /\bthe company\b/gi,
        "the organization"
      );
  }

  return rewritten;
}
