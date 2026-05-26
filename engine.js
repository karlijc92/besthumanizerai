function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  var cleaned = text.replace(/\s+/g, " ").trim();
  var sentences = splitSentences(cleaned);
  if (sentences.length === 0) return cleaned;

  sentences = sentences.map(function(s) { return transformSentence(s, mode); });
  sentences = varyStructure(sentences, mode);
  sentences = addBurstiness(sentences);

  var result = sentences.join(" ").replace(/\s+/g, " ").trim();
  if (!/[.!?]$/.test(result)) result += ".";
  return result;
}

function splitSentences(text) {
  var raw = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  return raw.map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 2; });
}

function transformSentence(sentence, mode) {
  var s = sentence;

  var swaps = [
    ["\\butilize\\b", "use"],
    ["\\butilizes\\b", "uses"],
    ["\\butilized\\b", "used"],
    ["\\bdemonstrates\\b", "shows"],
    ["\\bdemonstrate\\b", "show"],
    ["\\bindicate\\b", "point to"],
    ["\\bindicates\\b", "points to"],
    ["\\bincreased\\b", "grew"],
    ["\\bdecreased\\b", "fell"],
    ["\\bsignificant\\b", "notable"],
    ["\\bsignificantly\\b", "noticeably"],
    ["\\bprimarily\\b", "mainly"],
    ["\\bcommence\\b", "start"],
    ["\\bsubsequently\\b", "then"],
    ["\\bnevertheless\\b", "even so"],
    ["\\bfurthermore\\b", "beyond that"],
    ["\\bmoreover\\b", "on top of that"],
    ["\\bhowever\\b", "that said"],
    ["\\bin addition\\b", "also"],
    ["\\bprior to\\b", "before"],
    ["\\bin order to\\b", "to"],
    ["\\bdue to the fact that\\b", "because"],
    ["\\bit is worth noting that\\b", "notably"],
    ["\\boperating expenses\\b", "day-to-day costs"],
    ["\\bgross margin\\b", "profit margin"],
    ["\\bfree cash flow\\b", "available cash"],
    ["\\bnet revenue\\b", "total revenue"],
    ["\\byear-over-year\\b", "compared to last year"]
  ];

  swaps.forEach(function(pair) {
    s = s.replace(new RegExp(pair[0], "gi"), pair[1]);
  });

  if (mode === "academic") {
    s = s.replace(/\bshows\b/g, "suggests");
    s = s.replace(/\bpoints to\b/g, "indicates");
  }
  if (mode === "business" || mode === "executive") {
    s = s.replace(/\bgrew\b/g, "increased");
    s = s.replace(/\bfell\b/g, "declined");
  }
  if (mode === "plain") {
    s = s.replace(/\bsuggests\b/g, "means");
    s = s.replace(/\bindicates\b/g, "shows");
  }

  return s;
}

function varyStructure(sentences, mode) {
  if (sentences.length < 2) return sentences;

  var connectors = {
    "data-safe": ["The numbers reflect", "Looking at the data,", "The figures show that"],
    academic:    ["This suggests that", "Evidence points to", "Notably,"],
    business:    ["From a business standpoint,", "In practical terms,", "The result is that"],
    executive:   ["The key takeaway is that", "In summary,", "At a high level,"],
    resume:      ["This reflects", "A key example is that", "Worth highlighting,"],
    plain:       ["Simply put,", "In other words,", "What this means is"]
  };

  var list = connectors[mode] || connectors["plain"];
  var pick = list[Math.floor(Math.random() * list.length)];

  var targetIndex = sentences.length > 2 ? 1 : 0;
  var s = sentences[targetIndex];

  s = s.replace(/^(However|Furthermore|Moreover|Also|Additionally|That said)[,\s]+/i, "");
  s = s.charAt(0).toLowerCase() + s.slice(1);
  sentences[targetIndex] = pick + " " + s;

  if (sentences.length >= 4) {
    var tmp = sentences[2];
    sentences[2] = sentences[3];
    sentences[3] = tmp;
  }

  return sentences;
}

function addBurstiness(sentences) {
  var result = [];

  for (var i = 0; i < sentences.length; i++) {
    var s = sentences[i];

    if (s.length > 160 && s.indexOf(",") !== -1) {
      var mid = findMidComma(s);
      if (mid > 0) {
        var partA = s.slice(0, mid).trim();
        var partB = s.slice(mid + 1).trim();
        partB = partB.charAt(0).toUpperCase() + partB.slice(1);
        if (!/[.!?]$/.test(partA)) partA += ".";
        result.push(partA);
        result.push(partB);
        continue;
      }
    }

    if (i < sentences.length - 1 && s.length < 40 && sentences[i + 1].length < 40) {
      var next = sentences[i + 1];
      var merged = s.replace(/[.!?]+$/, "") + ", and " + next.charAt(0).toLowerCase() + next.slice(1);
      result.push(merged);
      i++;
      continue;
    }

    result.push(s);
  }

  return result;
}

function findMidComma(s) {
  var mid = Math.floor(s.length / 2);
  var best = -1;
  var minDist = s.length;
  for (var i = 0; i < s.length; i++) {
    if (s[i] === ",") {
      var dist = Math.abs(i - mid);
      if (dist < minDist) {
        minDist = dist;
        best = i;
      }
    }
  }
  return best;
}
