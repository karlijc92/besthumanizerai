let lastHumanizedText = "";

function humanizeText() {
  const input =
    document.getElementById("inputText").value;

  const output =
    document.getElementById("outputText");

  const rewriteMode =
    document.getElementById("rewriteMode").value;

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  let sourceText =
    lastHumanizedText.trim() !== "" ? lastHumanizedText : input;

  const originalNumbers =
    input.match(/[\d]+(?:\.\d+)?%?/g) || [];

  let humanized = sourceText;

  const rewritePatterns = [
    ["reported revenue growth", "saw revenue growth"],
    ["saw revenue growth", "posted stronger revenue growth"],
    ["experienced revenue growth", "continued showing revenue growth"],
    ["increasing total annual revenue", "bringing total annual revenue higher"],
    ["bringing total annual revenue higher", "lifting total annual revenue"],
    ["Operating expenses rose", "Operating expenses moved higher"],
    ["Operating expenses moved higher", "Operating expenses increased"],
    ["Operating expenses increased", "The company also saw higher operating expenses"],
    ["improved", "continued to improve"],
    ["continued to improve", "showed further improvement"],
    ["strengthened", "showed additional improvement"],
    ["Customer retention increased", "The company also improved customer retention"],
    ["The company also improved customer retention", "Customer retention continued to move higher"],
    ["average order value climbed", "average order value also increased"],
    ["average order value also increased", "average order value continued rising"],
    ["reduced fulfillment time", "managed to shorten fulfillment time"],
    ["managed to shorten fulfillment time", "cut down fulfillment time"],
    ["lowered customer acquisition costs", "reduced customer acquisition expenses"],
    ["reduced customer acquisition expenses", "brought customer acquisition expenses down"],
    ["therefore", "as a result"],
    ["however", "at the same time"],
    ["while", "and"],
    ["also", "in addition"]
  ];

  rewritePatterns.forEach(function(pair) {
    const pattern = new RegExp(pair[0], "gi");
    humanized = humanized.replace(pattern, pair[1]);
  });

  const sentences = humanized.split(". ");

  if (sentences.length > 2) {
    const firstSentence = sentences.shift();
    sentences.push(firstSentence);
    humanized = sentences.join(". ");
  }

  const newNumbers =
    humanized.match(/[\d]+(?:\.\d+)?%?/g) || [];

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
      "⚠ Possible number mismatch detected. Please review the output carefully.\n\n";
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
