// engine.js — calls /api/humanize for all users
const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";
const FREE_REWRITES = 3;
const FREE_CHARACTER_LIMIT = 1000;
const humanizeBtn = document.getElementById("humanizeBtn");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const rewriteCount = document.getElementById("rewriteCount");
const characterCount = document.getElementById("characterCount");
const upgradeMessage = document.getElementById("upgradeMessage");
const rewriteMode = document.getElementById("rewriteMode");
const copyBtn = document.getElementById("copyBtn");

function getRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}
function setRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}
function updateRewriteDisplay() {
  const used = getRewriteCount();
  rewriteCount.textContent = `${used} / ${FREE_REWRITES} Free Rewrites Used`;
}
function updateCharacterDisplay() {
  const count = inputText.value.length;
  characterCount.textContent = `${count} / ${FREE_CHARACTER_LIMIT} Characters`;
}

humanizeBtn.addEventListener("click", async function () {
  const currentCount = getRewriteCount();
  const originalInput =
    outputText.value.trim() !== "" ? outputText.value.trim() : inputText.value.trim();

  if (!originalInput) {
    alert("Please enter text to humanize.");
    return;
  }
  if (currentCount >= FREE_REWRITES && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML =
      'You have reached the free rewrite limit. <a href="pricing.html">Upgrade to continue.</a>';
    return;
  }
  if (originalInput.length > FREE_CHARACTER_LIMIT && !document.body.classList.contains("paid-user")) {
    upgradeMessage.innerHTML =
      'Free accounts are limited to 1,000 characters. <a href="pricing.html">Upgrade for longer text.</a>';
    return;
  }

  const selectedMode = rewriteMode ? rewriteMode.value.toLowerCase() : "data-safe";

  humanizeBtn.disabled = true;
  humanizeBtn.textContent = "Humanizing...";
  outputText.value = "";
  upgradeMessage.innerHTML = "";

  try {
    const { masked, map } = maskProtectedData(originalInput);

    const response = await fetch("/api/humanize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: masked, mode: selectedMode }),
    });

    const data = await response.json();
    if (!response.ok || !data.result) {
      upgradeMessage.innerHTML = "Something went wrong. Please try again.";
      return;
    }

    const restored = restoreProtectedData(data.result, map);
    outputText.value = restored;
    setRewriteCount(currentCount + 1);
    updateRewriteDisplay();
  } catch (err) {
    console.error("Humanize error:", err);
    upgradeMessage.innerHTML = "Connection error. Please try again.";
  } finally {
    humanizeBtn.disabled = false;
    humanizeBtn.textContent = "Humanize Text";
  }
});

if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    if (!outputText.value.trim()) {
      alert("Nothing to copy yet.");
      return;
    }
    navigator.clipboard.writeText(outputText.value).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Output"), 2000);
    });
  });
}

inputText.addEventListener("input", updateCharacterDisplay);
updateRewriteDisplay();
updateCharacterDisplay();
