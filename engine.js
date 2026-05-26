function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  const protected_ = lockData(text);
  let sentences = splitSentences(protected_.text);

  sentences = sentences.map(s => rewriteSentence(s, mode));
  sentences = shuffleMiddle(sentences);
  sentences = applyBurstiness(sentences);
  sentences = applyToneConnector(sentences, mode);

  let result = sentences.join(" ").replace(/\s+/g, " ").trim();
  result = restoreData(result, protected_.map);
  result = finalClean(result);
  if (!/[.!?]$/.test(result)) result += ".";
  return result;
}

function lockData(text) {
  const map = [];
  const locked = text.replace(
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|trillion|thousand)?%?|\b\d+(?:\.\d+)?%|\b(?:19|20)\d{2}\b|\bQ[1-4]\s?(?:19|20)\d{2}\b|\([A-Za-z]+,\s?\d{4}\)/gi,
    match => {
      const token = `{{D${map.length}}}`;
      map.push({ token, value: match });
      return token;
    }
  );
  return { text: locked, map };
}

function restoreData(text, map) {
  let out = text;
  map.forEach(item => {
    out = out.split(item.token).join(item.value);
  });
  return out;
}

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text])
    .map(s => s.trim())
    .filter(s => s.length > 8);
}

function stripOpener(s) {
  return s.replace(/^(On balance|By any measure|Notably|Taken together|In fact|That said|Also|And|But|Meanwhile|Furthermore|Moreover|Simply put|What this means is that|In plain terms|The bottom line here is that|From a results standpoint|In practical terms|The key takeaway is that|At a high level|This suggests that|The evidence points to the fact that|Analysis indicates that|The numbers show that|Looking at the data|The figures make clear that|The data makes clear that|This demonstrates that|A clear example of this is that|The impact here is that|In practice|At its core|Put simply|To that point|As it stands|Worth noting|Tied to that|On that front|Digging into|Looking more closely)[,\s—-]*/i, "").trim();
}

function rewriteSentence(s, mode) {
  s = applySwaps(s);

  if (Math.random() > 0.5) {
    const openers = [
      "In fact,", "Notably,", "As it stands,", "To that point,",
      "Put simply,", "On balance,", "At its core,", "In practice,",
      "By any measure,", "Taken together,"
    ];
    const clean = stripOpener(s);
    s = pick(openers) + " " + clean.charAt(0).toLowerCase() + clean.slice(1);
  }

  if (mode === "academic") {
    s = s.replace(/\bshows\b/g, "suggests");
    s = s.replace(/\bpoints to\b/g, "indicates");
  }
  if (mode === "plain") {
    s = s.replace(/\bindicates\b/g, "shows");
    s = s.replace(/\bsuggests\b/g, "means");
  }

  return s;
}

function applySwaps(s) {
  const pools = [
    [/\butilize[sd]?\b/gi, ["use", "apply", "employ"]],
    [/\bdemonstrate[sd]?\b/gi, ["show", "reveal", "reflect"]],
    [/\bindicate[sd]?\b/gi, ["point to", "suggest", "show"]],
    [/\bsignificantly\b/gi, ["notably", "meaningfully", "considerably"]],
    [/\bsignificant\b/gi, ["notable", "meaningful", "considerable"]],
    [/\bprimarily\b/gi, ["mainly", "largely", "mostly"]],
    [/\bfurthermore\b/gi, ["beyond that", "on top of that", "building on this"]],
    [/\bmoreover\b/gi, ["on top of that", "adding to this", "beyond that"]],
    [/\bhowever\b/gi, ["that said", "even so", "still"]],
    [/\bin addition\b/gi, ["also", "on top of that", "as well"]],
    [/\bprior to\b/gi, ["before", "ahead of"]],
    [/\bin order to\b/gi, ["to", "so as to"]],
    [/\bdue to the fact that\b/gi, ["because", "since", "given that"]],
    [/\bsubsequently\b/gi, ["after that", "then", "following this"]],
    [/\bnevertheless\b/gi, ["even so", "still", "that said"]],
    [/\byear-over-year\b/gi, ["from the prior year", "versus last year", "compared to a year ago"]],
    [/\bcompared with\b/gi, ["versus", "against"]],
    [/\bdriven (?:primarily )?by\b/gi, ["fueled by", "pushed by", "led by"]],
    [/\bartificial intelligence\b/gi, ["AI"]],
    [/\bmachine learning\b/gi, ["ML"]],
    [/\bfiscal year\b/gi, ["fiscal year"]],
    [/\boperating income\b/gi, ["operating profit", "operating earnings"]],
    [/\bnet income\b/gi, ["net profit", "bottom-line earnings"]],
    [/\bcloud services\b/gi, ["cloud products", "cloud offerings"]],
    [/\bcommercial bookings\b/gi, ["business bookings", "enterprise contracts"]],
    [/\bsuggesting\b/gi, ["pointing to", "indicating", "showing"]],
    [/\bdespite\b/gi, ["even with", "in spite of"]],
    [/\bmeanwhile\b/gi, ["at the same time", "separately"]],
    [/\brepresenting\b/gi, ["marking", "reflecting", "amounting to"]],
    [/\bimproved from\b/gi, ["moved up from", "climbed from"]],
    [/\brose from\b/gi, ["climbed from", "jumped from"]],
    [/\bstated that\b/gi, ["noted that", "said that", "confirmed that"]],
    [/\bexpanded\b/gi, ["grew", "widened", "increased"]],
    [/\bcapabilities\b/gi, ["capacity", "abilities", "strengths"]],
  ];

  pools.forEach(([pattern, replacement]) => {
    s = s.replace(pattern, () => pick(replacement));
  });

  return s;
}

function shuffleMiddle(sentences) {
  if (sentences.length < 4) return sentences;
  const mid = Math.floor(sentences.length / 2);
  const swap = mid + (Math.random() > 0.5 ? 1 : -1);
  if (swap > 0 && swap < sentences.length - 1) {
    [sentences[mid], sentences[swap]] = [sentences[swap], sentences[mid]];
  }
  return sentences;
}

function applyBurstiness(sentences) {
  const result = [];
  sentences.forEach(s => {
    if (s.length > 160 && s.indexOf(",") !== -1) {
      const mid = findMidComma(s);
      if (mid > 30 && mid < s.length - 30) {
        let a = s.slice(0, mid).trim();
        let b = s.slice(mid + 1).trim();
        if (!/[.!?]$/.test(a)) a += ".";
        b = b.charAt(0).toUpperCase() + b.slice(1);
        result.push(a, b);
        return;
      }
    }
    result.push(s);
  });
  return result;
}

function applyToneConnector(sentences, mode) {
  if (sentences.length < 2) return sentences;

  const connectors = {
    "data-safe": ["The numbers show that", "The data makes clear that", "Taken together,"],
    academic:    ["This suggests that", "Analysis indicates that", "The evidence points to the fact that"],
    business:    ["The bottom line is that", "In practical terms,", "From a results standpoint,"],
    executive:   ["The key takeaway is that", "At a high level,", "What this means is that"],
    resume:      ["This demonstrates that", "The impact here is that", "Worth highlighting,"],
    plain:       ["Simply put,", "What this means is", "In plain terms,"]
  };

  const list = connectors[mode] || connectors["plain"];
  const last = sentences.length - 1;

  // Strip any existing opener before applying connector
  let s = stripOpener(sentences[last]);
  s = s.charAt(0).toLowerCase() + s.slice(1);
  sentences[last] = pick(list) + " " + s;

  return sentences;
}

function finalClean(text) {
  return text
    .replace(/\b(\w+)\s+\1\b/gi, "$1")        // remove doubled words
    .replace(/\bthe the\b/gi, "the")           // catch "the the"
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?])\s*([a-z])/g, (m, p, q) => p + " " + q.toUpperCase())
    .trim();
}

function findMidComma(s) {
  const mid = Math.floor(s.length / 2);
  let best = -1, minDist = s.length;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ",") {
      const dist = Math.abs(i - mid);
      if (dist < minDist) { minDist = dist; best = i; }
    }
  }
  return best;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
