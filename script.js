// script.js — BestHumanizerAI

const TESTING_MODE = true;
const FREE_CHARACTER_LIMIT = 1000;

document.addEventListener("DOMContentLoaded", function () {
  initializeTool();
});

function initializeTool() {
  const input = document.getElementById("inputText");
  const button = document.getElementById("humanizeBtn");
  const copyButton = document.getElementById("copyBtn");

  if (input) {
    input.addEventListener("input", function () {
      updateUsageDisplay();
    });
  }

  if (button) button.onclick = humanizeText;
  if (copyButton) copyButton.onclick = copyOutputText;

  if (!localStorage.getItem("rewriteCountUsed")) {
    localStorage.setItem("rewriteCountUsed", "0");
  }

  updateUsageDisplay();
}

function updateUsageDisplay() {
  const input = document.getElementById("inputText");
  const rewriteCount = document.getElementById("rewriteCount");
  const charCount = document.getElementById("charCount");
  const used = parseInt(localStorage.getItem("rewriteCountUsed") || "0");

  if (rewriteCount) {
    rewriteCount.innerText = "Rewrites used: " + used;
  }
  if (input && charCount) {
    charCount.innerText = input.value.length.toLocaleString() + " characters";
  }
}

function setButtonLoading(isLoading) {
  const button = document.getElementById("humanizeBtn");
  if (!button) return;
  button.disabled = isLoading;
  button.innerText = isLoading ? "Humanizing..." : "Humanize Text";
}

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
    let humanized = await aggressiveHumanize(originalInput, rewriteMode);

    if (typeof humanized !== "string" || !humanized) {
      output.value = "Unexpected response. Please try again.";
      setButtonLoading(false);
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

function copyOutputText() {
  const output = document.getElementById("outputText");
  if (!output || !output.value.trim()) return;
  navigator.clipboard.writeText(output.value);
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    const original = copyBtn.innerText;
    copyBtn.innerText = "Copied!";
    setTimeout(function () { copyBtn.innerText = original; }, 1500);
  }
}
