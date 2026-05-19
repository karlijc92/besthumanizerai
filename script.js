let lastHumanizedText = "";

function humanizeText() {
  const input = document.getElementById("inputText").value;
  const output = document.getElementById("outputText");
  const rewriteMode = document.getElementById("rewriteMode").value;

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  const sourceText =
    lastHumanizedText.trim() !== ""
      ? lastHumanizedText
      : input;

  const originalNumbers =
    input.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  let humanized =
    sourceText.replace(/\s+/g, " ").trim();

  humanized = advancedHumanRewrite(
    humanized,
    rewriteMode
  );

  const newNumbers =
    humanized.match(/[\d]+(?:,\d{3})*(?:\.\d+)?%?/g) || [];

  const originalSorted = [...originalNumbers].sort();
  const newSorted = [...newNumbers].sort();

  let warningText = "";

  if (
    JSON.stringify(originalSorted) !==
    JSON.stringify(newSorted)
  ) {
    warningText =
      "⚠ Possible number mismatch detected. Please review carefully.\n\n";
  }

  let modeLabel = "";

  if (rewriteMode === "academic") {
    modeLabel = "Academic Mode:\n\n";
  }

  if (rewriteMode === "business") {
    modeLabel = "Business Report Mode:\n\n";
  }

  if (rewriteMode === "resume") {
    modeLabel = "Resume Mode:\n\n";
  }

  if (rewriteMode === "data-safe") {
    modeLabel = "Data-Safe Mode:\n\n";
  }

  lastHumanizedText = humanized;

  output.innerText =
    warningText +
    modeLabel +
    humanized;
}

function advancedHumanRewrite(text, mode) {

  let rewritten = text;

  const deepRewrites = [
    {
      pattern:
        /The company reported revenue growth of ([\d.,]+%?) in ([\d]{4}), increasing total annual revenue from \$?([\d.,]+)\s?million to \$?([\d.,]+)\s?million\./gi,

      replacements: [
        "Revenue continued climbing in $2, with growth of $1 pushing annual revenue from $3 million to $4 million.",
        "In $2, the company generated stronger revenue results, as growth of $1 increased annual revenue from $3 million to $4 million.",
        "The company experienced revenue expansion in $2, with annual revenue rising from $3 million to $4 million after growth of $1."
      ]
    },

    {
      pattern:
        /Operating expenses rose by ([\d.,]+%?) during the same period, while net income improved by ([\d.,]+%?) due to higher subscription retention and reduced acquisition costs\./gi,

      replacements: [
        "Although operating expenses increased by $1, net income still improved by $2 because of stronger customer retention and lower acquisition costs.",
        "The company saw operating expenses move higher by $1, but net income improved by $2 as retention strengthened and acquisition expenses declined.",
        "Even with a $1 increase in operating expenses, the business reported a $2 improvement in net income driven by customer retention gains and lower acquisition spending."
      ]
    },

    {
      pattern:
        /Customer retention increased from ([\d.,]+%?) in ([\d]{4}) to ([\d.,]+%?) in ([\d]{4}), and average order value climbed from \$?([\d.,]+) to \$?([\d.,]+)\./gi,

      replacements: [
        "Customer retention improved from $1 in $2 to $3 in $4, while average order value also increased from $5 to $6.",
        "The company retained more customers over time, with retention rising from $1 in $2 to $3 in $4. Average order value also moved higher from $5 to $6.",
        "Retention trends strengthened between $2 and $4, increasing from $1 to $3, while average order value rose from $5 to $6."
      ]
    },

    {
      pattern:
        /The company also reduced fulfillment time by ([\d.,]+%?) and lowered customer acquisition costs by ([\d.,]+%?) through workflow automation and targeted digital campaigns\./gi,

      replacements: [
        "Operational efficiency also improved, with fulfillment time reduced by $1 and customer acquisition costs lowered by $2 through automation initiatives and targeted campaigns.",
        "The company became more operationally efficient by cutting fulfillment time by $1 and reducing acquisition costs by $2 using automation and digital marketing strategies.",
        "Workflow automation and digital campaigns helped reduce fulfillment time by $1 while lowering customer acquisition expenses by $2."
      ]
    }
  ];

  deepRewrites.forEach((rule) => {

    rewritten = rewritten.replace(
      rule.pattern,
      function () {

        const args = arguments;

        const replacement =
          rule.replacements[
            Math.floor(
              Math.random() * rule.replacements.length
            )
          ];

        return replacement.replace(
          /\$(\d+)/g,
          (_, index) => args[index]
        );
      }
    );
  });

  const fillerVariations = [
    ["however", "even so"],
    ["therefore", "as a result"],
    ["in addition", "also"],
    ["overall", "taken together"],
    ["important", "notable"],
    ["significant", "meaningful"],
    ["improved", "became stronger"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["demonstrates", "suggests"],
    ["indicates", "shows"],
    ["while", "at the same time"]
  ];

  fillerVariations.forEach(([from, to]) => {

    rewritten = rewritten.replace(
      new RegExp(from, "gi"),
      to
    );
  });

  let sentences = rewritten
    .split(/(?<=\.)\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  sentences = sentences.map((sentence, index) => {

    if (
      index % 2 === 0 &&
      sentence.length > 70
    ) {

      const starters = [
        "What stands out is that",
        "One important takeaway is that",
        "From a broader perspective,",
        "Another factor worth noting is that",
        "The results also suggest that"
      ];

      const starter =
        starters[
          Math.floor(
            Math.random() * starters.length
          )
        ];

      return (
        starter +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1)
      );
    }

    return sentence;
  });

  if (sentences.length > 3) {

    const movedSentence =
      sentences.splice(0, 1)[0];

    sentences.splice(2, 0, movedSentence);
  }

  rewritten = sentences.join(" ");

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /What stands out is that/gi,
        "The findings suggest that"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /One important takeaway is that/gi,
        "From a business standpoint,"
      );
  }

  if (mode === "resume") {

    rewritten =
      rewritten.replace(
        /The company/gi,
        "The organization"
      );
  }

  if (mode === "data-safe") {

    rewritten +=
      "\n\nReview note: Numerical values and percentages should always be verified against the original source material before final use.";
  }

  return rewritten;
}
