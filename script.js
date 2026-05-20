const FREE_REWRITE_LIMIT = 3;
const FREE_CHARACTER_LIMIT = 1000;

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
      `
      <div style="
        margin-top:20px;
        padding:18px;
        border-radius:14px;
        background:#f9fafb;
        border:1px solid #e5e7eb;
        text-align:center;
      ">
        <h3 style="
          margin-bottom:10px;
          color:#111827;
        ">
          Upgrade Required
        </h3>

        <p style="
          color:#4b5563;
          line-height:1.6;
          margin-bottom:16px;
        ">
          Your free rewrites have been used.
          Upgrade to continue using BestHumanizerAI.
        </p>

        <a
          href="pricing.html"
          style="
            display:inline-block;
            background:#111827;
            color:white;
            padding:12px 20px;
            border-radius:10px;
            text-decoration:none;
            font-weight:700;
          "
        >
          View Pricing
        </a>
      </div>
      `;

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
      `
      <div style="
        margin-top:20px;
        padding:18px;
        border-radius:14px;
        background:#f9fafb;
        border:1px solid #e5e7eb;
        text-align:center;
      ">
        <h3 style="
          margin-bottom:10px;
          color:#111827;
        ">
          Need More Characters?
        </h3>

        <p style="
          color:#4b5563;
          line-height:1.6;
          margin-bottom:16px;
        ">
          Upgrade your account for larger rewrites,
          advanced modes, and higher monthly limits.
        </p>

        <a
          href="pricing.html"
          style="
            display:inline-block;
            background:#111827;
            color:white;
            padding:12px 20px;
            border-radius:10px;
            text-decoration:none;
            font-weight:700;
          "
        >
          Upgrade Plan
        </a>
      </div>
      `;

    return;
  }

  upgradeMessage.innerHTML = "";

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized = input;

  for (let i = 0; i < 4; i++) {
    humanized =
      deepHumanize(humanized, rewriteMode);
  }

  humanized =
    cleanRepeatedStarters(humanized);

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

  lastHumanizedText = humanized;

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

  const availableStarters = [
    "What stands out is that",
    "At the same time,",
    "Another thing worth noting is that",
    "Interestingly,",
    "From a broader perspective,",
    "The bigger picture here is that",
    "One detail that matters is that",
    "An important point is that",
    "Looking deeper into the data,",
    "From another angle,",
    "One trend becoming clearer is that",
    "What becomes noticeable is that",
    "A key takeaway here is that",
    "One thing the data suggests is that",
    "Looking at the trend overall,"
  ];

  let recentStarters = [];

  sentences = sentences.map((sentence, index) => {

    if (sentence.length < 15) {
      return sentence;
    }

    sentence =
      removeStarterStack(sentence);

    const alreadyHasStarter =
      startsWithStarter(
        sentence,
        availableStarters
      );

    const shouldAddStarter =
      !alreadyHasStarter &&
      index !== 0 &&
      sentence.length > 45 &&
      Math.random() > 0.5;

    if (shouldAddStarter) {

      let possibleStarters =
        availableStarters.filter(
          starter =>
            !recentStarters.includes(starter)
        );

      if (possibleStarters.length === 0) {

        recentStarters = [];
        possibleStarters =
          availableStarters;
      }

      const randomStarter =
        possibleStarters[
          Math.floor(
            Math.random() *
            possibleStarters.length
          )
        ];

      recentStarters.push(randomStarter);

      if (recentStarters.length > 5) {
        recentStarters.shift();
      }

      sentence =
        randomStarter +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    if (
      sentence.length > 115 &&
      Math.random() > 0.4
    ) {

      sentence =
        sentence.replace(
          /, while/gi,
          ". Meanwhile,"
        );

      sentence =
        sentence.replace(
          /, and/gi,
          ". Additionally,"
        );

      sentence =
        sentence.replace(
          /, because/gi,
          ". This occurred because"
        );
    }

    if (Math.random() > 0.55) {

      sentence =
        sentence.replace(
          /\bthe company\b/gi,
          "the business"
        );
    }

    if (Math.random() > 0.72) {

      sentence =
        sentence.replace(
          /\bthe business\b/gi,
          "the organization"
        );
    }

    return sentence;

  });

  rewritten =
    sentences.join(" ");

  rewritten =
    cleanRepeatedStarters(rewritten);

  rewritten =
    rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /Interestingly,/gi,
        "Importantly,"
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
        /Interestingly,/gi,
        "Notably,"
      );
  }

  return rewritten;
}

function startsWithStarter(sentence, starters) {

  return starters.some(
    starter =>
      sentence
        .toLowerCase()
        .startsWith(
          starter.toLowerCase()
        )
  );
}

function removeStarterStack(sentence) {

  const starterPatterns = [
    "what stands out is that",
    "another thing worth noting is that",
    "from a broader perspective,",
    "the bigger picture here is that",
    "one detail that matters is that",
    "an important point is that",
    "looking deeper into the data,",
    "from another angle,",
    "one trend becoming clearer is that",
    "what becomes noticeable is that",
    "a key takeaway here is that",
    "one thing the data suggests is that",
    "looking at the trend overall,"
  ];

  let cleaned =
    sentence.trim();

  let starterCount = 0;

  let keepChecking = true;

  while (keepChecking) {

    keepChecking = false;

    for (const starter of starterPatterns) {

      const regex =
        new RegExp(
          "^" +
          escapeRegExp(starter) +
          "\\s+",
          "i"
        );

      if (regex.test(cleaned)) {

        starterCount++;

        if (starterCount > 1) {

          cleaned =
            cleaned.replace(regex, "");

          keepChecking = true;

          break;
        }
      }
    }
  }

  return cleaned;
}

function cleanRepeatedStarters(text) {

  const stackFixes = [
    [/What stands out is that one thing the data suggests is that/gi, "One thing the data suggests is that"],
    [/What stands out is that what becomes noticeable is that/gi, "What becomes noticeable is that"],
    [/What stands out is that one detail that matters is that/gi, "One detail that matters is that"],
    [/From a broader perspective, another thing worth noting is that/gi, "Another thing worth noting is that"]
  ];

  let cleaned = text;

  stackFixes.forEach(pair => {

    cleaned =
      cleaned.replace(
        pair[0],
        pair[1]
      );
  });

  return cleaned;
}

function escapeRegExp(string) {

  return string.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}
