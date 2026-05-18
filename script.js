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

  const originalNumbers =
    input.match(/[\d]+(?:\.\d+)?%?/g) || [];

  let humanized = input;

  const rewritePatterns = [

    ["reported revenue growth", "saw revenue growth"],
    ["experienced revenue growth", "continued showing revenue growth"],
    ["increasing total annual revenue", "bringing total annual revenue higher"],
    ["Operating expenses rose", "Operating expenses moved higher"],
    ["Operating expenses increased", "The company also saw higher operating expenses"],
    ["improved", "continued to improve"],
    ["strengthened", "showed additional improvement"],
    ["Customer retention increased", "The company also improved customer retention"],
    ["average order value climbed", "average order value also increased"],
    ["reduced fulfillment time", "managed to shorten fulfillment time"],
    ["lowered customer acquisition costs", "reduced customer acquisition expenses"],
    ["therefore", "as a result"],
    ["however", "at the same time"],
    ["while", "and"],
    ["also", "in addition"]

  ];

  rewritePatterns.forEach(function(pair) {

    const pattern =
      new RegExp(pair[0], "gi");

    humanized =
      humanized.replace(pattern, pair[1]);

  });

  const sentences =
    humanized.split(". ");

  if (sentences.length > 2) {

    const firstSentence =
      sentences.shift();

    sentences.push(firstSentence);

    humanized =
      sentences.join(". ");
  }

  if (rewriteMode === "academic") {

    humanized =
      "Academic Mode:\n\n" + humanized;
  }

  if (rewriteMode === "business") {

    humanized =
      "Business Report Mode:\n\n" + humanized;
  }

  if (rewriteMode === "resume") {

    humanized =
      "Resume Mode:\n\n" + humanized;
  }

  if (rewriteMode === "data-safe") {

    humanized =
      "Data-Safe Mode:\n\n" + humanized;
  }

  const newNumbers =
    humanized.match(/[\d]+(?:\.\d+)?%?/g) || [];

  const originalSorted =
    [...originalNumbers].sort();

  const newSorted =
    [...newNumbers].sort();

  let numberWarning =
    "✔ Numbers preserved successfully.";

  if (
    JSON.stringify(originalSorted) !==
    JSON.stringify(newSorted)
  ) {

    numberWarning =
      "⚠ Possible number mismatch detected.";
  }

  output.innerText =
    numberWarning +
    "\n\n" +
    humanized;
}
