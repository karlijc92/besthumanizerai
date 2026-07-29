// engine.js — calls /api/humanize, gates usage by real Supabase plan when logged in
const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";
const FREE_REWRITES = 3;
const FREE_CHARACTER_LIMIT = 1000;

const PLAN_LIMITS = {
  free:    { rewrites: 3,   chars: 1000 },
  basic:   { rewrites: 50,  chars: 5000 },
  pro:     { rewrites: 250, chars: 15000 },
  premium: { rewrites: Infinity, chars: Infinity }
};

const humanizeBtn = document.getElementById("humanizeBtn");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const rewriteCount = document.getElementById("rewriteCount");
const characterCount = document.getElementById("characterCount");
const upgradeMessage = document.getElementById("upgradeMessage");
const rewriteMode = document.getElementById("rewriteMode");
const copyBtn = document.getElementById("copyBtn");

let currentUser = null;
let currentProfile = null;

function getLocalRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}
function setLocalRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}

function getActiveLimits() {
  if (currentProfile) {
    return PLAN_LIMITS[currentProfile.plan] || PLAN_LIMITS.free;
  }
  return PLAN_LIMITS.free;
}

function getActiveUsedCount() {
  return currentProfile ? (currentProfile.rewrite_count || 0) : getLocalRewriteCount();
}

function updateRewriteDisplay() {
  const used = getActiveUsedCount();
  const limits = getActiveLimits();
  const label = limits.rewrites === Infinity ? "Unlimited" : `${used} / ${limits.rewrites}`;
  rewriteCount.textContent = `${label} Rewrites Used`;
}

function updateCharacterDisplay() {
  const count = inputText.value.length;
  const limits = getActiveLimits();
  const limitLabel = limits.chars === Infinity ? "Unlimited" : limits.chars;
  characterCount.textContent = `${count} / ${limitLabel} Characters`;
}

// Load real session + profile on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      currentProfile = profile || null;
    }
  } catch (err) {
    console.error("Could not load profile:", err);
  }
  updateRewriteDisplay();
  updateCharacterDisplay();
});

humanizeBtn.addEventListener("click", async function () {
  const originalInput = inputText.value.trim();
  if (!originalInput) {
    alert("Please enter text to humanize.");
    return;
  }

  const limits = getActiveLimits();
  const used = getActiveUsedCount();

  if (used >= limits.rewrites) {
    upgradeMessage.innerHTML =
      'You have reached your rewrite limit. <a href="pricing.html">Upgrade to continue.</a>';
    return;
  }
  if (originalInput.length > limits.chars) {
    upgradeMessage.innerHTML =
      `Your plan is limited to ${limits.chars} characters. <a href="pricing.html">Upgrade for longer text.</a>`;
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

    if (currentUser && currentProfile) {
      const newCount = (currentProfile.rewrite_count || 0) + 1;
      currentProfile.rewrite_count = newCount;
      await supabaseClient
        .from("profiles")
        .update({ rewrite_count: newCount })
        .eq("id", currentUser.id);
    } else {
      setLocalRewriteCount(getLocalRewriteCount() + 1);
    }
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
