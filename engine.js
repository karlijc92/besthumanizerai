function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  var cleaned = text.replace(/\s+/g, " ").trim();
  var sentences = splitSentences(cleaned);
  if (sentences.length === 0) return cleaned;

  sentences = sentences.map(function (s) { return transformSentence(s, mode); });
  sentences = varyStructure(sentences, mode);
  sentences = addBurstiness(sentences);

  var result = sentences.join(" ").replace(/\s+/g, " ").trim();
  if (!/[.!?]$/.test(result)) result += ".";
  return result;
}

function splitSentences(text) {
  var raw = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  return raw.map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 2; });
}

function transformSentence(sentence, mode) {
  var s = sentence;

  // Word-level humanization
  var swaps = {
    "\\butilize\\b": "use",
    "\\butilizes\\b": "uses",
    "\\butilized\\b": "used",
    "\\bdemonstrates\\b": "shows",
    "\\bdemonstrate\\b": "show",
    "\\bindicate\\b": "point to",
    "\\bindicates\\b": "points to",
    "\\bincreased\\b": "grew",
    "\\bdecreased\\b": "fell",
    "\\bsignificant\\b": "notable",
    "\\bsignificantly\\b": "noticeably",
    "\\bprimarily\\b": "mainly",
    "\\bcommence\\b": "start",
    "\\bsubsequently\\b": "then",
    "\\bnevertheless\\b": "even so",
    "\\bfurthermore\\b": "beyond that",
    "\\bmoreover\\b": "on top of that",
    "\\bhowever\\b": "that said",
    "\\bin addition\\b": "also",
    "\\bprior to\\b": "before",
    "\\bin order to\\b": "to",
    "\\bdue to the fact that\\b": "because",
    "\\bit is worth noting that\\b": "notably",
    "\\boperating expenses\\b": "day-to-day costs",
    "\\bgross margin\\b": "profit margin",
    "\\bfree cash flow\\b": "available cash",
    "\\bnet revenue\\b": "total revenue",
    "\\byear-over-year\\b": "compared to last year",
    "\\bQ([1-4])\\b": "the $1 quarter"
  };

  Object.keys(swaps).forEach(function (pattern) {
    s = s.replace(new RegExp(pattern, "gi"), swaps[pattern]);
  });

  // Mode-specific tone shaping
  if (mode === "academic") {
    s = s.replace(/\bshows\b/g, "suggests").replace(/\bpoints to\b/g, "indicates");
  }
  if (mode === "business" || mode === "executive") {
    s = s.replace(/\bgrew\b/g, "increased").replace(/\bfell\b/g, "declined");
  }
  if (mode === "plain") {
    s = s.replace(/\bsuggests\b/g, "means").replace(/\bindicates\b/g, "shows");
  }

  return s;
}

function varyStructure(sentences, mode) {
  if (sentences.length < 2) return sentences;

  // Rotate one sentence to start with a connector
  var connectors = {
    "data-safe": ["The numbers reflect", "Looking at the data,", "The figures show that"],
    academic:    ["This suggests that", "Evidence points to", "Notably,"],
    business:    ["From a business standpoint,", "In practical terms,", "The result is that"],
    executive:   ["The key takeaway is that", "In summary,", "At a high level,"],
    resume:      ["This reflects", "A key example is that", "Worth highlighting —"],
    plain:       ["Simply put,", "In other words,", "What this means is"]
  };

  var list = connectors[mode] || connectors["plain"];
  var pick = list[Math.floor(Math.random() * list.length)];

  // Apply connector to a middle sentence, not the first or last
  var targetIndex = sentences.length > 2 ? 1 : 0;
  var s = sentences[targetIndex];

  // Strip leading connector-like words before adding ours
  s = s.replace(/^(However|Furthermore|Moreover|Also|Additionally|That said)[,\s]+/i, "");

  // Lowercase first char if connector ends without punctuation
  if (pick.slice(-1) !== ".") {
    s = s.charAt(0).toLowerCase() + s.slice(1);
  }

  sentences[targetIndex] = pick + " " + s;

  // Swap two middle sentences for unpredictability (if enough sentences)
  if (sentences.length >= 4) {
    var tmp = sentences[2];
    sentences[2] = sentences[3];
    sentences[3] = tmp;
  }

  return sentences;
}

function addBurstiness(sentences) {
  // Vary sentence length — split one long sentence, compress one short pair
  var result = [];

  for (var i = 0; i < sentences.length; i++) {
    var s = sentences[i]
