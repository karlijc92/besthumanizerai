function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  const protected_ = lockData(text);
  let sentences = splitSentences(protected_.text);

  sentences = sentences.map(s => rewriteSentence(s, mode));
  sentences = shuffleMiddle(sentences);
  sentences = applyBurstiness(sentences);
  sentences = applyToneConnectors(sentences, mode);

  let result = sentences.join(" ").replace(/\s+/g, " ").trim();
  result = restoreData(result, protected_.map);
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

function rewriteSentence(s, mode) {
  s = applySwaps(s);
  s = restructureOnce(s);
  return s;
}

function applySwaps(s) {
  const pools = [
    [/\butilize[sd]?\b/gi, ["use", "apply", "employ"]],
    [/\bdemonstrate[sd]?\b/gi, ["show", "reveal", "reflect"]],
    [/\bindicate[sd]?\b/gi, ["point to", "suggest", "show"]],
    [/\bsignificant(ly)?\b/gi, (m, p) => p ? pick(["notably","meaningfully","considerably"]) : pick(["notable","meaningful","considerable"])],
    [/\bprimarily\b/gi, ["mainly","largely","mostly"]],
    [/\bfurthermore\b/gi, ["beyond that","on top of that","building on this"]],
    [/\bmoreover\b/gi, ["on top of that","adding to this","beyond that"]],
    [/\bhowever\b/gi, ["that said","even so","still"]],
    [/\bin addition\b/gi, ["also","on top of that","as well"]],
    [/\bprior to\b/gi, ["before","ahead of"]],
    [/\bin order to\b/gi, ["to","so as to"]],
    [/\bdue to the fact that\b/gi, ["because","since","given that"]],
    [/\bsubsequently\b/gi, ["after that","then","following this"]],
    [/\bnevertheless\b/gi, ["even so","still","that said"]],
    [/\bcommenced\b/gi, ["started","began","kicked off"]],
    [/\byear-over-year\b/gi, ["from the prior year","versus last year","compared to a year ago"]],
    [/\bcompared with\b/gi, ["versus","against","next to"]],
    [/\bdriven (?:primarily )?by\b/gi, ["fueled by","pushed by","led by"]],
    [/\bartificial intelligence\b/gi, ["AI"]],
    [/\bmachine learning\b/gi, ["ML"]],
    [/\bfiscal year\b/gi, ["the fiscal year","that fiscal year"]],
    [/\boperating income\b/gi, ["operating profit","operating earnings"]],
    [/\bnet income\b/gi, ["net profit","bottom-line earnings"]],
    [/\bcloud services\b/gi, ["cloud products","cloud offerings"]],
    [/\binfrastructure adoption\b/gi, ["infrastructure growth","infrastructure expansion"]],
    [/\bcommercial bookings\b/gi, ["business bookings","enterprise contracts"]],
    [/\bsuggesting\b/gi, ["pointing to","indicating","showing"]],
    [/\bdespite\b/gi, ["even with","in spite of"]],
    [/\bmeanwhile\b/gi, ["at the same time","separately","on another front"]],
    [/\brepresenting\b/gi, ["marking","reflecting","amounting to"]],
    [/\bimproved from\b/gi, ["moved up from","climbed from","rose from"]],
    [/\brose from\b/gi, ["climbed from","jumped from","moved up from"]],
  ];

  pools.forEach(([pattern, replacement]) => {
    if (typeof replacement === "function") {
      s = s.replace(pattern, replacement);
    } else {
      s = s.replace(pattern, () => pick(replacement));
    }
  });

  return s;
}

function restructureOnce(s) {
  if (Math.random() > 0.45) return s;

  const openers = [
    "In fact,",
    "Notably,",
    "As it stands,",
    "To that point,",
    "Put simply,",
    "On balance,",
    "At its core,",
    "In practice,",
    "By any measure,",
    "Taken together,"
  ];

  s = s.replace(/^(That said|Also|And|But|Meanwhile|Furthermore|Moreover)[,\s]+/i, "");
  const opener = pick(openers);
  return opener + " " + s.charAt(0).toLowerCase() + s.slice(1);
}

function shuffleMiddle(sentences) {
  if (sentences.length < 4) return sentences;
  const mid = Math.floor(sentences.length / 2);
  const offset = Math.random() > 0.5 ? 1 : -1;
  const swap = mid + offset;
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

function applyToneConnectors(sentences, mode) {
  if (sentences.length < 2) return sentences;

  const connectors = {
    "data-safe": ["The numbers show that", "Looking at the data,", "The figures make clear that"],
    academic:    ["This suggests that", "The evidence points to the fact that", "Analysis indicates that"],
    business:    ["The bottom line here is that", "From a results standpoint,", "In practical terms,"],
    executive:   ["The key takeaway is that", "At a high level,", "What this means for the business is that"],
    resume:      ["This demonstrates that", "A clear example of this is that", "The impact here is that"],
    plain:       ["Simply put,", "What this means is that", "In plain terms,"]
  };

  const list = connectors[mode] || connectors["plain"];
  const last = sentences.length - 1;
  let s = sentences[last];
  s = s.replace(/^(Worth noting|Tied to that|On that front|Digging into|Looking more closely|Notably,|In fact,|As it stands,|To that point,|Put simply,|On balance,|At its core,|In practice,|By any measure,|Taken together,)[,\s]*/i, "");
  s = s.charAt(0).toLowerCase() + s.slice(1);
  sentences[last] = pick(list) + " " + s;

  return sentences;
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
