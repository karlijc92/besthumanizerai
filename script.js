function humanizeText() {

  const input = document.getElementById("inputText").value;

  const output = document.getElementById("outputText");

  if (input.trim() === "") {
    output.innerText = "Please paste text first.";
    return;
  }

  output.innerText =
    "Humanized Version:\n\n" +
    input;
}
