function humanizeText() {

  const input = document.getElementById("inputText").value;

  const output = document.getElementById("outputText");

  const rewriteMode =
    document.getElementById("rewriteMode").value;

  if (input.trim() === "") {

    output.innerText = "Please paste text first.";

    return;
  }

  const originalNumbers =
    input.match(/\d+[%.,]?\d*/g) || [];

  let humanized = input;

  humanized = humanized.replace(
    /reported revenue growth/gi,
    "saw revenue growth"
  );

  humanized = humanized.replace(
    /increasing total annual revenue/gi,
    "bringing total annual revenue higher"
  );

  humanized = humanized.replace(
    /Operating expenses rose/gi,
    "Operating expenses moved higher"
  );

  humanized = humanized.replace(
    /improved/gi,
    "continued to improve"
  );

  humanized = humanized.replace(
    /Customer retention increased/gi,
    "The company also improved customer retention"
  );

  humanized = humanized.replace(
    /average order value climbed/gi,
    "average order value also increased"
  );

  humanized = humanized.replace(
    /reduced fulfillment time/gi,
    "managed to shorten fulfillment time"
  );

  humanized = humanized.replace(
    /lowered customer acquisition costs/gi,
    "reduced customer acquisition expenses"
  );

  humanized = humanized.replace(
    /The organization also/gi,
    "In addition,"
  );

  humanized = humanized.replace(
    /while/gi,
    "and"
  );

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
    humanized.match(/\d+[%.,]?\d*/g) || [];

  let numberWarning =
    "✔ Numbers preserved successfully.";

  if (
    JSON.stringify(originalNumbers) !==
    JSON.stringify(newNumbers)
  ) {

    numberWarning =
      "⚠ Possible number mismatch detected.";
  }

  output.innerText =
    numberWarning +
    "\n\n" +
    humanized;
}
