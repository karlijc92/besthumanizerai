let lastHumanizedText = "";

function humanizeText() {
  const input = document.getElementById("inputText").value;
  const output = document.getElementById("outputText");
  const rewriteMode = document.getElementById("rewriteMode").value;

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized = input;

  for (let i = 0; i < 4; i++) {
    humanized = deepHumanize(humanized, rewriteMode);
  }

  humanized = cleanRepeatedStarters(humanized);

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

    sentence = removeStarterStack(sentence);

    const alreadyHasStarter = startsWithStarter(sentence, availableStarters);

    const shouldAddStarter =
      !alreadyHasStarter &&
      index !== 0 &&
      sentence.length > 45 &&
      Math.random() > 0.5;

    if (shouldAddStarter) {
      let possibleStarters =
        availableStarters.filter(
          starter => !recentStarters.includes(starter)
        );

      if (possibleStarters.length === 0) {
        recentStarters = [];
        possibleStarters = availableStarters;
      }

      const randomStarter =
        possibleStarters[
          Math.floor(Math.random() * possibleStarters.length)
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

    if (sentence.length > 115 && Math.random() > 0.4) {
      sentence = sentence.replace(/, while/gi, ". Meanwhile,");
      sentence = sentence.replace(/, and/gi, ". Additionally,");
      sentence = sentence.replace(/, because/gi, ". This occurred because");
    }

    if (Math.random() > 0.55) {
      sentence = sentence.replace(/\bthe company\b/gi, "the business");
    }

    if (Math.random() > 0.72) {
      sentence = sentence.replace(/\bthe business\b/gi, "the organization");
    }

    if (Math.random() > 0.65) {
      sentence = sentence.replace(/\bshows\b/gi, "illustrates");
    }

    if (Math.random() > 0.65) {
      sentence = sentence.replace(/\bimportant\b/gi, "notable");
    }

    return sentence;
  });

  if (sentences.length > 4 && Math.random() > 0.4) {
    const moved = sentences.splice(0, 1)[0];
    sentences.splice(2, 0, moved);
  }

  if (sentences.length > 6 && Math.random() > 0.5) {
    const movedSecond = sentences.splice(4, 1)[0];
    sentences.splice(1, 0, movedSecond);
  }

  rewritten = sentences.join(" ");
  rewritten = cleanRepeatedStarters(rewritten);
  rewritten = rewritten.replace(/\s+/g, " ").trim();

  if (mode === "academic") {
    rewritten = rewritten.replace(/Interestingly,/gi, "Importantly,");
    rewritten = rewritten.replace(
      /What stands out is that/gi,
      "The findings suggest that"
    );
  }

  if (mode === "business") {
    rewritten = rewritten.replace(
      /What stands out is that/gi,
      "From a business standpoint,"
    );

    rewritten = rewritten.replace(
      /The bigger picture here is that/gi,
      "From an operational perspective,"
    );
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/\bthe business\b/gi, "the organization");
    rewritten = rewritten.replace(/\bthe company\b/gi, "the organization");
  }

  if (mode === "data-safe") {
    rewritten = rewritten.replace(/Interestingly,/gi, "Notably,");
  }

  return rewritten;
}

function startsWithStarter(sentence, starters) {
  return starters.some(starter =>
    sentence.toLowerCase().startsWith(starter.toLowerCase())
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

  let cleaned = sentence.trim();
  let starterCount = 0;

  let keepChecking = true;

  while (keepChecking) {
    keepChecking = false;

    for (const starter of starterPatterns) {
      const regex = new RegExp("^" + escapeRegExp(starter) + "\\s+", "i");

      if (regex.test(cleaned)) {
        starterCount++;

        if (starterCount > 1) {
          cleaned = cleaned.replace(regex, "");
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
    [/From a broader perspective, another thing worth noting is that/gi, "Another thing worth noting is that"],
    [/From a broader perspective, what becomes noticeable is that/gi, "What becomes noticeable is that"],
    [/Another thing worth noting is that what becomes noticeable is that/gi, "What becomes noticeable is that"],
    [/One thing the data suggests is that what stands out is that/gi, "What stands out is that"],
    [/One thing the data suggests is that one detail that matters is that/gi, "One detail that matters is that"],
    [/What becomes noticeable is that looking at the trend overall,/gi, "Looking at the trend overall,"],
    [/The bigger picture here is that meanwhile,/gi, "Meanwhile,"]
  ];

  let cleaned = text;

  stackFixes.forEach(pair => {
    cleaned = cleaned.replace(pair[0], pair[1]);
  });

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
