const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";
const FREE_REWRITES = 300;
const FREE_CHARACTER_LIMIT = 1000;

function getRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}

function setRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}

function updateRewriteDisplay() {
  const el = document.getElementById("rewriteCount");
  if (el) el.textContent = getRewriteCount() + " / " + FREE_REWRITES + " Free Rewrites Used";
}

function updateCharacterDisplay() {
  const input = document.getElementById("inputText");
  const el = document.getElementById("characterCount");
  if (el && input) el.textContent = input.value.length + " / " + FREE_CHARACTER_LIMIT + " Characters";
}

function protectNumbers(text) {
  const items = [];
  const result = text.replace(/(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:\.\d+)?%|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?)/gi, function(match) {
    items.push(match);
    return "PROTECT" + (items.length - 1) + "END";
  });
  return { result, items };
}

function restoreNumbers(text, items) {
  let result = text.replace(/PROTECT(\d+)END/g, function(match, index) {
    return items[parseInt(index)] || match;
  });
  result = result.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  result = result.replace(/(\d),\s+(\d)/g, "$1,$2");
  return result;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rewriteSentence(sentence, mode) {
  const replacements = {
    "demonstrates": ["shows", "reveals", "makes clear"],
    "significant": ["major", "notable", "real"],
    "increase": ["rise", "jump", "climb"],
    "decrease": ["drop", "decline", "fall"],
    "approximately": ["around", "roughly", "close to"],
    "therefore": ["because of this", "as a result", "so"],
    "additionally": ["also", "on top of that", "and"],
    "however": ["still", "even so", "but"],
    "utilized": ["used", "applied"],
    "regarding": ["about", "on"],
    "reported": ["posted", "recorded", "logged"],
    "represented": ["made up", "accounted for", "came in at"],
    "generated": ["brought in", "pulled in", "posted"],
    "increased": ["rose", "climbed", "jumped"],
    "decreased": ["fell", "dropped", "slid"],
    "decline": ["drop", "fall", "dip"],
    "despite": ["even with", "though"],
    "expansion": ["increase", "jump", "gain"],
    "year-over-year": ["from a year earlier", "versus last year"],
    "prior year": ["year before", "last year"],
    "furthermore": ["and", "also"],
    "moreover": ["and", "also"],
    "notably": ["and", "also"],
    "overall": ["in total", "across the board"],
    "ultimately": ["in the end"],
    "robust": ["strong", "solid"],
    "pivotal": ["key", "important"],
    "crucial": ["important", "key"],
    "leverage": ["use", "apply"],
    "facilitate": ["help", "support"],
    "underscore": ["show", "highlight"],
    "meaningful":
