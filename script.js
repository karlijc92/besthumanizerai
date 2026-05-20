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
  const input = document.getElementById("inputText");
  const rewriteCounter = document.getElementById("rewriteCounter");
  const characterCounter = document.getElementById("characterCounter");

  if (!input || !rewriteCounter || !characterCounter) return;

  const currentCount = parseInt(localStorage.getItem("freeRewriteCount") || "0");
  const remaining = FREE_REWRITE_LIMIT - currentCount;

  rewriteCounter.innerText = `Free rewrites remaining: ${Math.max(remaining, 0)}`;
  characterCounter.innerText = `${input.value.length.toLocaleString()} / ${FREE_CHARACTER_LIMIT.toLocaleString()} characters`;
}

function renderUpgradeOptions(title, description) {
  return `
    <div style="margin-top:24px;padding:24px;border-radius:20px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 12px 35px rgba(15,23,42,0.08);">
      <h3 style="margin-bottom:12px;color:#111827;font-size:28px;">${title}</h3>
      <p style="color:#4b5563;line-height:1.7;margin-bottom:24px;">${description}</p>

      <div style="display:grid;gap:16px;">
        <a href="${BASIC_LINK}" style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
          <strong>$9/month — Basic</strong><br>
          50 rewrites/month • 5,000 characters
        </a>

        <a href="${PRO_LINK}" style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:2px solid #111827;color:#111827;background:#ffffff;">
          <strong>$19/month — Pro</strong><br>
          250 rewrites/month • 15,000 characters
        </a>

        <a href="${PREMIUM_LINK}" style="display:block;text-decoration:none;padding:16px 18px;border-radius:14px;border:1px solid #d1d5db;color:#111827;background:#f9fafb;">
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
    output.innerText = `Free accounts are limited to ${FREE_CHARACTER_LIMIT.toLocaleString()} characters.`;
    upgradeMessage.innerHTML = renderUpgradeOptions(
      "Need More Characters?",
      "Upgrade your account for larger rewrites, advanced modes, and higher monthly rewrite limits."
    );
    return;
  }

  upgradeMessage.innerHTML = "";

  const originalNumbers = input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let bestOutput = "";
  let bestScore = -9999;

  for (let attempt = 0; attempt < 7; attempt++) {
    let candidate = input;

    for (let pass = 0; pass < 4; pass++) {
      candidate = humanizeCandidate(candidate, rewriteMode, attempt, pass);
    }

    candidate = finalCleanup(candidate);

    const score = scoreHumanVariation(candidate);

    if (score > bestScore) {
      bestScore = score;
      bestOutput = candidate;
    }
  }

  const newNumbers = bestOutput.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];
  const originalSorted = [...originalNumbers].sort();
  const newSorted = [...newNumbers].sort();

  let warningText = "";

  if (JSON.stringify(originalSorted) !== JSON.stringify(newSorted)) {
    warningText = "⚠ Possible number mismatch detected.\n\n";
  }

  output.innerText = warningText + bestOutput;

  localStorage.setItem("freeRewriteCount", String(currentCount + 1));
  updateUsageDisplay();
}

function humanizeCandidate(text, mode, attempt, pass) {
  let rewritten = text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["reported revenue growth", "saw stronger revenue performance"],
    ["generated revenue", "brought in revenue"],
    ["compared with", "up from"],
    ["representing annual growth of", "which worked out to annual growth of"],
    ["Gross profit increased", "Gross profit moved higher"],
    ["operating margin improved", "operating margin got better"],
    ["Marketing expenses rose", "Marketing expenses increased"],
    ["technology spending increased", "technology spending moved up"],
    ["Net income climbed", "Net income rose"],
    ["diluted earnings per share improved", "diluted earnings per share increased"],
    ["Customer retention increased", "Customer retention strengthened"],
    ["average subscription revenue per user rose", "average subscription revenue per user moved higher"],
    ["Cash and cash equivalents ended the year at", "Cash and cash equivalents finished the year at"],
    ["total liabilities declining", "total liabilities falling"],
    ["reduced customer acquisition costs", "lowered customer acquisition costs"],
    ["during the same reporting period", "over the same reporting period"],
    ["therefore", "because of this"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["primarily", "mostly"]
  ];

  replacements.forEach(pair => {
    rewritten = rewritten.replace(new RegExp(pair[0], "gi"), pair[1]);
  });

  let sentences = rewritten
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const openers = [
    "What stands out is that",
    "At the same time,",
    "Another detail worth noting is that",
    "From a broader perspective,",
    "The bigger picture here is that",
    "One detail that matters is that",
    "Looking deeper into the numbers,",
    "A closer look shows that",
    "The numbers also point to the fact that"
  ];

  sentences = sentences.map((sentence, index) => {
    if (sentence.length < 18) return sentence;

    if ((index + pass + attempt) % 3 === 0 && Math.random() > 0.25) {
      const opener = openers[Math.floor(Math.random() * openers.length)];
      sentence = opener + " " + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }

    if (sentence.length > 110) {
      sentence = sentence.replace(/, while/gi, ". Meanwhile,");
      sentence = sentence.replace(/, and/gi, ". Also,");
      sentence = sentence.replace(/, because/gi, ". This happened because");
      sentence = sentence.replace(/, with/gi, ". This came with");
    }

    if (Math.random() > 0.45) {
      sentence = sentence.replace(/\bthe company\b/gi, "the business");
    }

    if (Math.random() > 0.72) {
      sentence = sentence.replace(/\bthe business\b/gi, "the organization");
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

  if (sentences.length > 6 && Math.random() > 0.5) {
    const last = sentences.pop();
    sentences.splice(2, 0, last);
  }

  rewritten = sentences.join(" ");

  if (mode === "academic") {
    rewritten = rewritten.replace(/What stands out is that/gi, "The findings suggest that");
    rewritten = rewritten.replace(/Another detail worth noting is that/gi, "Another important finding is that");
  }

  if (mode === "business") {
    rewritten = rewritten.replace(/What stands out is that/gi, "From a business standpoint,");
    rewritten = rewritten.replace(/The bigger picture here is that/gi, "From an operational perspective,");
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/\bthe company\b/gi, "the organization");
    rewritten = rewritten.replace(/\bthe business\b/gi, "the organization");
  }

  if (mode === "data-safe") {
    rewritten = rewritten.replace(/Looking deeper into the numbers,/gi, "Looking at the numbers,");
  }

  return rewritten.replace(/\s+/g, " ").trim();
}

function scoreHumanVariation(text) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const lengths = sentences.map(s => s.length);

  if (lengths.length === 0) return -9999;

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;

  const transitionCount =
    (text.match(/What stands out|At the same time|Another detail|broader perspective|bigger picture|Looking deeper|closer look/gi) || []).length;

  const uniqueWords = new Set(text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/));
  const totalWords = text.split(/\s+/).length;

  const varietyScore = uniqueWords.size / Math.max(totalWords, 1);

  return variance * 0.04 + varietyScore * 80 - transitionCount * 2;
}

function finalCleanup(text) {
  let cleaned = text;

  cleaned = cleaned.replace(/What stands out is that what stands out is that/gi, "What stands out is that");
  cleaned = cleaned.replace(/At the same time, at the same time,/gi, "At the same time,");
  cleaned = cleaned.replace(/Looking deeper into the numbers, looking deeper into the numbers,/gi, "Looking deeper into the numbers,");
  cleaned = cleaned.replace(/\. Also, Also,/gi, ". Also,");
  cleaned = cleaned.replace(/\. Meanwhile, Meanwhile,/gi, ". Meanwhile,");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}
