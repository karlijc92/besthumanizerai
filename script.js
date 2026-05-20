const FREE_REWRITE_LIMIT = 3;
const FREE_CHARACTER_LIMIT = 1000;

const BASIC_LINK =
  "https://buy.stripe.com/6oU28sc8J50m6GG0RpeME0j";

const PRO_LINK =
  "https://buy.stripe.com/14AfZi8WxcsOd547fNeME0k";

const PREMIUM_LINK =
  "https://buy.stripe.com/7sY8wQ0q1akG6GGcA7eME0l";

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

  rewriteCounter.innerText = `Free rewrites remaining: ${Math.max(remaining, 0)}`;
  characterCounter.innerText = `${input.value.length.toLocaleString()} / ${FREE_CHARACTER_LIMIT.toLocaleString()} characters`;
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
      <h3 style="margin-bottom:12px;color:#111827;font-size:28px;">
        ${title}
      </h3>

      <p style="color:#4b5563;line-height:1.7;margin-bottom:24px;">
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
  const input = document.getElementById("inputText").value;
  const output = document.getElementById("outputText");
  const rewriteMode = document.getElementById("rewriteMode").value;
  const upgradeMessage = document.getElementById("upgradeMessage");

  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");

  if (currentCount >= FREE_REWRITE_LIMIT) {
    output.innerText = "Free rewrites have been used.";

    upgradeMessage.innerHTML = renderUpgradeOptions(
      "Upgrade Required",
      "Your free rewrites have been used. Upgrade now to continue humanizing longer reports, business writing, resumes, and academic work."
    );

    return;
  }

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  if (input.length > FREE_CHARACTER_LIMIT) {
    output.innerText =
      `Free accounts are limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;

    upgradeMessage.innerHTML = renderUpgradeOptions(
      "Need More Characters?",
      "Upgrade your account for larger rewrites, advanced modes, and higher monthly rewrite limits."
    );

    return;
  }

  upgradeMessage.innerHTML = "";

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized = input;

  for (let i = 0; i < 4; i++) {
    humanized = deepHumanize(humanized, rewriteMode);
  }

  humanized = cleanRepeatedStarters(humanized);
  humanized = cleanupAwkwardPhrases(humanized);

  const newNumbers =
    humanized.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  const originalSorted = [...originalNumbers].sort();
  const newSorted = [...newNumbers].sort();

  let warningText = "";

  if (JSON.stringify(originalSorted) !== JSON.stringify(newSorted)) {
    warningText = "⚠ Possible number mismatch detected.\n\n";
  }

  lastHumanizedText = humanized;
  output.innerText = warningText + humanized;

  localStorage.setItem("freeRewriteCount", String(currentCount + 1));
  updateUsageDisplay();
}

function deepHumanize(text, mode) {
  let rewritten = text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["reported revenue growth", "saw stronger revenue performance"],
    ["Operating expenses rose", "Operating costs moved higher"],
    ["net income improved", "profitability still improved"],
    ["Customer retention increased", "Customer retention became stronger"],
    ["average order value climbed", "average order value moved upward"],
    ["reduced fulfillment time", "shortened fulfillment timelines"],
    ["lowered customer acquisition costs", "reduced customer acquisition spending"],
    ["therefore", "because of this"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["demonstrates", "shows"],
    ["significant", "fairly meaningful"],
    ["during the same period", "around that same time"],
    ["management stated", "management noted"],
    ["primarily", "mostly"]
  ];

  replacements.forEach(pair => {
    rewritten = rewritten.replace(new RegExp(pair[0], "gi"), pair[1]);
  });

  let sentences =
    rewritten
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);

  const availableStarters = [
    "What stands out is that",
    "At the same time,",
    "Another thing worth noting is that",
    "From a broader perspective,",
    "The bigger picture here is that",
    "One detail that matters is that",
    "Looking deeper into the data,"
  ];

  let usedStarters = [];

  sentences = sentences.map((sentence, index) => {
    if (sentence.length < 15) {
      return sentence;
    }

    sentence = removeStarterStack(sentence);

    const shouldAddStarter =
      index !== 0 &&
      index % 2 === 0 &&
      sentence.length > 45 &&
      Math.random() > 0.25;

    if (shouldAddStarter) {
      let possibleStarters =
        availableStarters.filter(starter => !usedStarters.includes(starter));

      if (possibleStarters.length === 0) {
        usedStarters = [];
        possibleStarters = availableStarters;
      }

      const randomStarter =
        possibleStarters[Math.floor(Math.random() * possibleStarters.length)];

      usedStarters.push(randomStarter);

      sentence =
        randomStarter +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    if (sentence.length > 105 && Math.random() > 0.3) {
      sentence = sentence.replace(/, while/gi, ". Meanwhile,");
      sentence = sentence.replace(/, and/gi, ". Also,");
      sentence = sentence.replace(/, because/gi, ". This happened because");
      sentence = sentence.replace(/, though/gi, ". Even so,");
    }

    if (Math.random() > 0.5) {
      sentence = sentence.replace(/\bthe company\b/gi, "the business");
    }

    if (Math.random() > 0.72) {
      sentence = sentence.replace(/\bthe business\b/gi, "the organization");
    }

    if (Math.random() > 0.65) {
      sentence = sentence.replace(/\bstronger\b/gi, "better");
    }

    return sentence;
  });

  if (sentences.length > 3 && Math.random() > 0.25) {
    const moved = sentences.splice(0, 1)[0];
    sentences.splice(2, 0, moved);
  }

  if (sentences.length > 5 && Math.random() > 0.35) {
    const movedSecond = sentences.splice(4, 1)[0];
    sentences.splice(1, 0, movedSecond);
  }

  rewritten = sentences.join(" ");
  rewritten = rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {
    rewritten = rewritten.replace(/What stands out is that/gi, "The findings suggest that");
    rewritten = rewritten.replace(/Another thing worth noting is that/gi, "Another important finding is that");
  }

  if (mode === "business") {
    rewritten = rewritten.replace(/What stands out is that/gi, "From a business standpoint,");
    rewritten = rewritten.replace(/The bigger picture here is that/gi, "From an operational perspective,");
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/\bthe business\b/gi, "the organization");
    rewritten = rewritten.replace(/\bthe company\b/gi, "the organization");
  }

  if (mode === "data-safe") {
    rewritten = rewritten.replace(/Looking deeper into the data,/gi, "Looking at the data,");
  }

  return rewritten;
}

function removeStarterStack(sentence) {
  const starters = [
    "what stands out is that",
    "at the same time,",
    "another thing worth noting is that",
    "from a broader perspective,",
    "the bigger picture here is that",
    "one detail that matters is that",
    "looking deeper into the data,"
  ];

  let cleaned = sentence.trim();

  starters.forEach(starter => {
    const regex = new RegExp("^" + escapeRegExp(starter) + "\\s+", "i");

    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, "");
    }
  });

  return cleaned;
}

function cleanRepeatedStarters(text) {
  const stackFixes = [
    [/What stands out is that one thing the data suggests is that/gi, "One thing the data suggests is that"],
    [/What stands out is that what becomes noticeable is that/gi, "What becomes noticeable is that"],
    [/What stands out is that one detail that matters is that/gi, "One detail that matters is that"],
    [/From a broader perspective, another thing worth noting is that/gi, "Another thing worth noting is that"],
    [/The bigger picture here is that looking at the full picture/gi, "Looking at the full picture"],
    [/Looking deeper into the data, looking at the full picture/gi, "Looking at the full picture"],
    [/An important point is that additionally/gi, "Additionally"],
    [/One thing the data suggests is that meanwhile/gi, "Meanwhile"],
    [/Looking at the trend looking at the full picture/gi, "Looking at the full picture"]
  ];

  let cleaned = text;

  stackFixes.forEach(pair => {
    cleaned = cleaned.replace(pair[0], pair[1]);
  });

  return cleaned.replace(/\s+/g, " ").trim();
}

function cleanupAwkwardPhrases(text) {
  let cleaned = text;

  cleaned = cleaned.replace(/\. Also, Also,/gi, ". Also,");
  cleaned = cleaned.replace(/\. Meanwhile, Meanwhile,/gi, ". Meanwhile,");
  cleaned = cleaned.replace(/\. This happened because This happened because/gi, ". This happened because");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
