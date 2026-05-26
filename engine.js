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
  return raw
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 10; });
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
    ["\\bdecreased\\b", "dropped"],
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
    ["\\byear-over-year\\b", "from the prior year"],
    ["\\bcompared with\\b", "versus"],
    ["\\bcompared to the prior fiscal year\\b", "from a year earlier"],
    ["\\bdriven primarily by\\b", "fueled mainly by"],
    ["\\bdriven by\\b", "fueled by"],
    ["\\bexpanded\\b", "broader"],
    ["\\binfrastructure adoption\\b", "infrastructure growth"],
    ["\\bstating that\\b", "noting that"],
    ["\\bstated that\\b", "noted that"],
    ["\\brose from\\b", "climbed from"],
    ["\\bimproved from\\b", "moved up from"],
    ["\\brepresenting a\\b", "a"],
    ["\\bwhile\\b", "and"],
    ["\\bmeanwhile\\b", "at the same time"],
    ["\\bsuggesting\\b", "pointing to"],
    ["\\bdespite\\b", "even with"],
    ["\\bcapabilities\\b", "capacity"],
    ["\\binvestments in\\b", "spending on"],
    ["\\bcommercial bookings\\b", "business bookings"],
    ["\\bclimbed\\b", "rose"],
    ["\\bmanagement also stated\\b", "the company also noted"],
    ["\\bfiscal year\\b", "the fiscal year"],
    ["\\bcloud services\\b", "cloud products"],
    ["\\benterprise\\b", "business"],
    ["\\bartificial intelligence\\b", "AI"],
    ["\\bmachine learning\\b", "ML"]
  ];

  swaps.forEach(function(pair) {
    s = s.replace(new RegExp(pair[0], "gi"), pair[1]);
  });

  // Restructure sentences that start with a number or company name
  s = restructure(s, mode);

  if (mode === "academic") {
    s = s.replace(/\bshows\b/g, "suggests");
    s = s.replace(/\bpoints to\b/g, "indicates");
  }
  if (mode === "business" || mode === "executive") {
    s = s.replace(/\bdropped\b/g, "declined");
  }
  if (mode === "plain") {
    s = s.replace(/\bsuggests\b/g, "means");
    s = s.replace(/\bindicates\b/g, "shows");
  }

  return s;
}

function restructure(s, mode) {
  // Pattern: "X verb Y" → flip with a lead-in phrase
  var leadIns = [
    "Worth noting here —",
    "On that front,",
    "As part of that picture,",
    "Digging into the detail,",
    "Looking more closely,",
    "Tied to that,"
  ];

  // Only restructure some sentences to avoid repetition
  if (Math.random() > 0.5) return s;

  var lead = leadIns[Math.floor(Math.random() * leadIns.length)];

  // Strip any existing opener
  s = s.replace(/^(That said|Also|And|But|At the same time)[,\s]+/i, "");

  // Lowercase first letter after lead-in
  s = lead + " " + s.charAt(0).toLowerCase() + s.slice(1);

  return s;
}

function varyStructure(sentences, mode) {
  if (sentences.length < 2) return sentences;

  var connectors = {
    "data-safe": ["The figures point to", "Looking at the numbers,", "The data makes clear that"],
    academic:    ["This suggests that", "The evidence indicates that", "Notably,"],
    business:    ["From a business standpoint,", "In practical terms,", "The result here is that"],
    executive:   ["The key takeaway is that", "Stepping back,", "At a high level,"],
    resume:      ["This reflects", "A strong example here is that", "Worth highlighting,"],
    plain:       ["Simply put,", "In plain terms,", "What this really means is"]
  };

  var list = connectors[mode] || connectors["plain"];
  var pick = list[Math.floor(Math.random() * list.length)];

  // Target the LAST sentence for a connector wrap — avoids doubling up on middle sentences
  var targetIndex = sentences.length - 1;
  var s = sentences[targetIndex];

  // Remove any lead-in already added by restructure()
  s = s.replace(/^(Worth noting here —|On that front,|As part of that picture,|Digging into the detail,|Looking more closely,|Tied to that,)\s*/i, "");
  s = s.replace(/^(However|Furthermore|Moreover|Also|Additionally|That said)[,\s]+/i, "");
  s = s.charAt(0).toLowerCase() + s.slice(1);

  sentences[targetIndex] = pick + " " + s;

  // Swap two middle sentences for unpredictability
  if (sentences.length >= 4) {
    var tmp = sentences[1];
    sentences[1] = sentences[3];
    sentences[3] = tmp;
  }

  return sentences;
}

function addBurstiness(sentences) {
  var result = [];

  for (var i = 0; i < sentences.length; i++) {
    var s = sentences[i];

    // Only split very long sentences that have a natural comma break
    if (s.length > 180 && s.indexOf(",") !== -1) {
      var mid = findMidComma(s);
      if (mid > 30 && mid < s.length - 30) {
        var partA = s.slice(0, mid).trim();
        var partB = s.slice(mid + 1).trim();
        partB = partB.charAt(0).toUpperCase() + partB.slice(1);
        if (!/[.!?]$/.test(partA)) partA += ".";
        result.push(partA);
        result.push(partB);
        continue;
      }
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
