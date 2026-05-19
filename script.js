let lastHumanizedText = "";

function humanizeText() {
  const input = document.getElementById("inputText").value;
  const output = document.getElementById("outputText");
  const rewriteMode = document.getElementById("rewriteMode").value;

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  const sourceText = lastHumanizedText.trim() !== "" ? lastHumanizedText : input;

  const originalNumbers = input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized = sourceText
    .replace(/\s+/g, " ")
    .trim();

  humanized = protectNumbersAndRewrite(humanized, rewriteMode);

  const newNumbers = humanized.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  const originalSorted = [...originalNumbers].sort();
  const newSorted = [...newNumbers].sort();

  let warningText = "";

  if (JSON.stringify(originalSorted) !== JSON.stringify(newSorted)) {
    warningText =
      "⚠ Possible number mismatch detected. Please review the output carefully.\n\n";
  }

  let modeLabel = "";

  if (rewriteMode === "academic") {
    modeLabel = "Academic Mode:\n\n";
  } else if (rewriteMode === "business") {
    modeLabel = "Business Report Mode:\n\n";
  } else if (rewriteMode === "resume") {
    modeLabel = "Resume Mode:\n\n";
  } else if (rewriteMode === "data-safe") {
    modeLabel = "Data-Safe Mode:\n\n";
  }

  lastHumanizedText = humanized;

  output.innerText = warningText + modeLabel + humanized;
}

function protectNumbersAndRewrite(text, mode) {
  let rewritten = text;

  const sentenceRewrites = [
    {
      find: /The company reported revenue growth of ([\d,]+(?:\.\d+)?%?) in ([\d]{4}), increasing total annual revenue to \$?([\d,.]+)\s?million\./i,
      replace:
        "In $2, the company’s revenue moved higher, with growth of $1 bringing annual revenue to $3 million."
    },
    {
      find: /Operating expenses rose by ([\d,]+(?:\.\d+)?%?), while net income improved by ([\d,]+(?:\.\d+)?%?) during the same period\./i,
      replace:
        "During the same period, operating expenses increased by $1, but net income still improved by $2."
    },
    {
      find: /Customer retention increased from ([\d,]+(?:\.\d+)?%?) to ([\d,]+(?:\.\d+)?%?), and average order value climbed from \$?([\d,.]+) to \$?([\d,.]+)\./i,
      replace:
        "Customer retention also strengthened, rising from $1 to $2. At the same time, average order value moved from $3 to $4."
    },
    {
      find: /The company reduced fulfillment time by ([\d,]+(?:\.\d+)?%?) and lowered customer acquisition costs by ([\d,]+(?:\.\d+)?%?)\./i,
      replace:
        "The company also improved efficiency by reducing fulfillment time by $1 and bringing customer acquisition costs down by $2."
    }
  ];

  sentenceRewrites.forEach((rule) => {
    rewritten = rewritten.replace(rule.find, rule.replace);
  });

  const generalRewrites = [
    ["This demonstrates", "This suggests"],
    ["This indicates", "This shows"],
    ["significant", "meaningful"],
    ["therefore", "as a result"],
    ["however", "even so"],
    ["in addition", "also"],
    ["overall", "taken together"],
    ["improved", "became stronger"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["shows that", "points to"],
    ["it is important to note that", "one important point is that"]
  ];

  generalRewrites.forEach(([from, to]) => {
    rewritten = rewritten.replace(new RegExp(from, "gi"), to);
  });

  let sentences = rewritten
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  sentences = sentences.map((sentence, index) => {
    if (index % 3 === 1 && !sentence.startsWith("This") && sentence.length > 60) {
      return "What matters here is that " + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }

    if (index % 4 === 2 && sentence.length > 80) {
      return sentence.replace(", and", ". This also means");
    }

    return sentence;
  });

  if (sentences.length > 3) {
    const first = sentences.shift();
    sentences.splice(2, 0, first);
  }

  rewritten = sentences.join(" ");

  if (mode === "academic") {
    rewritten = rewritten.replace(/What matters here is that/gi, "This finding is important because");
  }

  if (mode === "business") {
    rewritten = rewritten.replace(/This finding is important because/gi, "From a business perspective,");
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/The company/gi, "The organization");
  }

  if (mode === "data-safe") {
    rewritten = rewritten + "\n\nReview note: Numbers, percentages, and years should be checked against the original before final use.";
  }

  return rewritten;
}
