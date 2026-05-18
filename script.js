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

  humanized = humanized.replace(/\butilize\b/gi, "use");
  humanized = humanized.replace(/\bfurthermore\b/gi, "also");
  humanized = humanized.replace(/\bin order to\b/gi, "to");
  humanized = humanized.replace(/\btherefore\b/gi, "so");
  humanized = humanized.replace(/\bhowever\b/gi, "but");

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
