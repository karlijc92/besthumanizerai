async function humanizeText() {
  const inputElement = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  const rewriteModeElement = document.getElementById("rewriteMode");
  const upgradeMessage = document.getElementById("upgradeMessage");

  if (!inputElement || !output || !rewriteModeElement) {
    alert("Tool setup error. Please check the page files.");
    return;
  }

  const originalInput = inputElement.value.trim();
  const rewriteMode = rewriteModeElement.value;

  if (!originalInput) {
    output.value = "Please paste your text first.";
    return;
  }

  if (upgradeMessage) upgradeMessage.innerHTML = "";

  setButtonLoading(true);
  output.value = "Rewriting... this takes a few seconds.";

  try {
    const textToRewrite = output.value && output.value !== "Rewriting... this takes a few seconds." && output.value !== "Please paste your text first." ? output.value : originalInput;

    let humanized = await aggressiveHumanize(textToRewrite, rewriteMode);

    if (typeof humanized !== "string" || !humanized) {
      output.value = "Unexpected response. Please try again.";
      return;
    }

    output.value = humanized;

    const used = parseInt(localStorage.getItem("rewriteCountUsed") || "0");
    localStorage.setItem("rewriteCountUsed", String(used + 1));
    updateUsageDisplay();

  } catch (e) {
    output.value = "Something went wrong. Please try again.";
    console.error(e);
  } finally {
    setButtonLoading(false);
  }
}
