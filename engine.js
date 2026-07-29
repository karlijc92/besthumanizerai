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

function showOnPageError(msg) {
  upgradeMessage.innerHTML = `<span style="color:#b91c1c; font-weight:600;">DEBUG: ${msg}</span>`;
}

function getLocalRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}
function setLocalRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}

async function getLiveUserAndProfile() {
  if (typeof supabaseClient === "undefined") {
    showOnPageError("supabaseClient is not defined — auth.js did not load.");
    return { user: null, profile: null };
  }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return { user: null, profile: null };
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error) {
      showOnPageError("Profile fetch failed: " + error.message);
      return { user: session.user, profile: null };
    }
    return { user: session.user, profile };
  } catch (err) {
    showOnPageError("Session check failed: " + err.message);
    return { user: null, profile: null };
  }
}

function getLimitsFor(profile) {
  if (profile) return PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free;
  return PLAN_LIMITS.free;
}

async function refreshDisplay() {
  const { profile } = await getLiveUserAndProfile();
  const limits = getLimitsFor(profile);
  const used = profile ? (profile.rewrite_count || 0) : getLocalRewriteCount();
  const label = limits.rewrites === Infinity ? "Unlimited" : `${used} / ${limits.rewrites}`;
  rewriteCount.textContent = `${label} Rewrites Used`;

  const count = inputText.value.length;
  const limitLabel = limits.chars === Infinity ? "Unlimited" : limits.chars;
  characterCount.textContent = `${count} / ${limitLabel} Characters`;
}

window.addEventListener("DOMContentLoaded", refreshDisplay);
inputText.addEventListener("input", refreshDisplay);

humanizeBtn.addEventListener("click", async function () {
  try {
    upgradeMessage.innerHTML = "";
    const originalInput = inputText.value.trim();
    if (!originalInput) {
      alert("Please enter text to humanize.");
      return;
    }

    const { user, profile } = await getLiveUserAndProfile();
    const limits = getLimitsFor(profile);
    const used = profile ? (profile.rewrite_count || 0) : getLocalRewriteCount();
    const isPaidButProfileMissing = user && !profile;

    if (!isPaidButProfileMissing) {
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
    }

    const selectedMode = rewriteMode ? rewriteMode.value.toLowerCase() : "data-safe";
    humanizeBtn.disabled = true;
    humanizeBtn.textContent = "Humanizing...";
    outputText.value = "";

    if (typeof maskProtectedData !== "function") {
      showOnPageError("maskProtectedData is not defined — protect.js did not load.");
      return;
    }

    const { masked, map } = maskProtectedData(originalInput);
    const response = await fetch("/api/humanize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: masked, mode: selectedMode }),
    });

    if (!response.ok) {
      const text = await response.text();
      showOnPageError(`API returned ${response.status}: ${text.slice(0, 200)}`);
      return;
    }

    const data = await response.json();
    if (!data.result) {
      showOnPageError("API responded but no result field: " + JSON.stringify(data).slice(0, 200));
      return;
    }

    const restored = restoreProtectedData(data.result, map);
    outputText.value = restored;

    if (user && profile) {
      const newCount = (profile.rewrite_count || 0) + 1;
      await supabaseClient.from("profiles").update({ rewrite_count: newCount }).eq("id", user.id);
    } else if (!user) {
      setLocalRewriteCount(getLocalRewriteCount() + 1);
    }
    await refreshDisplay();
  } catch (err) {
    showOnPageError("Unexpected error: " + err.message);
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
