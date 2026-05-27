const HUMANIZER_LIMIT_KEY = "besthumanizerai_rewrite_count";

const FREE_REWRITES = 300;
const FREE_CHARACTER_LIMIT = 1000;

let lastHumanizedText = "";

const humanizeBtn = document.getElementById("humanizeBtn");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const rewriteCount = document.getElementById("rewriteCount");
const characterCount = document.getElementById("characterCount");
const upgradeMessage = document.getElementById("upgradeMessage");
const rewriteMode = document.getElementById("rewriteMode");

function getRewriteCount() {
  return Number(localStorage.getItem(HUMANIZER_LIMIT_KEY) || 0);
}

function setRewriteCount(value) {
  localStorage.setItem(HUMANIZER_LIMIT_KEY, value);
}

function updateRewriteDisplay() {
  rewriteCount.textContent = `${getRewriteCount()} / ${FREE_REWRITES} Free Rewrites Used`;
}

function updateCharacterDisplay() {
  const count = inputText.value.length;
  characterCount.textContent = `${count} / ${FREE_CHARACTER_LIMIT} Characters`;
}

function protectNumbers(text) {
  const items = [];
  const result = text.replace(/(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?%?|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b)/gi, function(match) {
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

function shuffleSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length < 2) return text;
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }
  return sentences.join(" ");
}

function rewriteSentence(sentence, mode) {
  const replacements = {
    demonstrates: ["shows", "reveals", "indicates"],
    significant: ["major", "notable", "important"],
    increase: ["rise", "growth", "climb"],
    decrease: ["drop", "decline", "reduction"],
    approximately: ["around", "roughly", "close to"],
    therefore: ["because of this", "as a result", "for that reason"],
    additionally: ["also", "in addition", "plus"],
    however: ["still", "even so", "at the same time"],
    utilized: ["used", "applied"],
    regarding: ["a
