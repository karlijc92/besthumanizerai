let lastHumanizedText = "";

function humanizeText() {

  const input =
    document.getElementById("inputText").value;

  const output =
    document.getElementById("outputText");

  const rewriteMode =
    document.getElementById("rewriteMode").value;

  if (input.trim() === "") {
    output.innerText =
      "Please paste text first.";
    return;
  }

  const sourceText =
    lastHumanizedText.trim() !== ""
      ? lastHumanizedText
      : input;

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized =
    deepHumanize(sourceText, rewriteMode);

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
}

function deepHumanize(text, mode) {

  let rewritten = text;

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
    ["significant", "fairly meaningful"]
  ];

  replacements.forEach(pair => {

    rewritten = rewritten.replace(
      new RegExp(pair[0], "gi"),
      pair[1]
    );
  });

  let sentences =
    rewritten.split(/(?<=[.!?])\s+/);

  sentences = sentences.map((sentence, index) => {

    sentence = sentence.trim();

    if (sentence.length < 15) {
      return sentence;
    }

    if (index % 2 === 0) {

      const starters = [
        "What stands out is that",
        "At the same time,",
        "Another thing worth noting is that",
        "Interestingly,",
        "From a broader perspective,"
      ];

      const randomStarter =
        starters[
          Math.floor(
            Math.random() * starters.length
          )
        ];

      sentence =
        randomStarter +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    if (
      sentence.length > 120 &&
      Math.random() > 0.5
    ) {

      sentence =
        sentence.replace(/, while/gi, ". Meanwhile,");

      sentence =
        sentence.replace(/, and/gi, ". Also,");
    }

    if (
      Math.random() > 0.6
    ) {

      sentence =
        sentence.replace(
          /\bthe company\b/gi,
          "the business"
        );
    }

    return sentence;

  });

  if (sentences.length > 3) {

    const moved =
      sentences.splice(0, 1)[0];

    sentences.splice(2, 0, moved);
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

  return rewritten;
}
