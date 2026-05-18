function humanizeText() {

  const input = document.getElementById("inputText").value;

  const output = document.getElementById("outputText");

  if (input.trim() === "") {

    output.innerText = "Please paste text first.";

    return;
  }

  let humanized = input;

  humanized = humanized.replace(/\butilize\b/gi, "use");
  humanized = humanized.replace(/\bfurthermore\b/gi, "also");
  humanized = humanized.replace(/\bin order to\b/gi, "to");
  humanized = humanized.replace(/\btherefore\b/gi, "so");
  humanized = humanized.replace(/\bhowever\b/gi, "but");

  output.innerText =
    "Humanized Version:\n\n" +
    humanized;
}
