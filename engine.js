// engine.js — BestHumanizerAI

async function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") return "";

  try {
    let result = text;

    // Step 1 — protect numbers by storing them
    const numbers = [];
    result = result.replace(/(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:\.\d+)?%|\bQ[1-4]\s?\d{4}\b|\b(?:19|20)\d{2}\b|[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?)/gi, function(match) {
      numbers.push(match);
      return "NUM" + (numbers.length - 1) + "END";
    });

    // Step 2 — replace AI words
    const aiWords = {
      "utilized": "used", "utilize": "use", "utilizes": "uses",
      "leveraged": "used", "leverage": "use", "leverages": "uses",
      "facilitated": "helped", "facilitate": "help", "facilitates": "helps",
      "robust": "strong", "pivotal": "key", "crucial": "important",
      "navigated": "managed", "navigate": "manage",
      "underscored": "showed", "underscore": "show", "underscores": "shows",
      "delved": "dug", "delve": "dig",
      "meaningful": "real", "meaningfully": "really",
      "underlying": "actual", "narrative": "story",
      "headwinds": "pressure", "landscape": "environment",
      "demonstrates": "shows", "indicate": "show", "indicates": "shows",
      "Furthermore": "", "Moreover": "", "Notably": "",
      "Overall": "", "Ultimately": "", "Clearly": ""
    };

    Object.entries(aiWords).forEach(function([word, replacement]) {
      const regex = new RegExp("\\b" + word + "\\b", "gi");
      result = result.replace(regex, replacement);
    });

    // Step 3 — replace common words with natural alternatives
    const swaps = [
      [/\breported\b/gi, ["posted", "recorded", "logged", "put up"]],
      [/\brepresented\b/gi, ["made up", "accounted for", "came in at"]],
      [/\bgenerated\b/gi, ["brought in", "pulled in", "posted"]],
      [/\bincreased\b/gi, ["rose", "climbed", "jumped", "went up"]],
      [/\bdecreased\b/gi, ["fell", "dropped", "slid", "came down"]],
      [/\bdecline\b/gi, ["drop", "fall", "dip", "slide"]],
      [/\bdespite\b/gi, ["even with", "though", "even though"]],
      [/\bexpansion\b/gi, ["increase", "jump", "gain", "rise"]],
      [/\byear-over-year\b/gi, ["from a year earlier", "versus last year", "compared to the prior year"]],
      [/\bprior year\b/gi, ["year before", "previous year", "last year"]],
    ];

    swaps.forEach(function([pattern, options]) {
      result = result.replace(pattern, function() {
        return options[Math.floor(Math.random() * options.length)];
      });
    });

    // Step 4 — add contractions
    result = result.replace(/\bit is\b/gi, "it's");
    result = result.replace(/\bthat is\b/gi, "that's");
    result = result.replace(/\bwas not\b/gi, "wasn't");
    result = result.replace(/\bdid not\b/gi, "didn't");
    result = result.replace(/\bdoes not\b/gi, "doesn't");
    result = result.replace(/\bhere is\b/gi, "here's");
    result = result.replace(/\bthere is\b/gi, "there's");
    result = result.replace(/\bthey are\b/gi, "they're");

    // Step 5 — kill AI closing phrases
    result = result.replace(/[^.!?]*(?:tells a different story|worth paying attention|conditions evolve|space to watch|reflects confidence|harder to ignore|some markets faced|moving forward|going forward|at this juncture)[^.!?]*[.!?]/gi, "");

    // Step 6 — clean up double spaces
    result = result.replace(/\s{2,}/g, " ").trim();

    // Step 7 — restore numbers exactly
    result = result.replace(/NUM(\d+)END/g, function(match, index) {
      return numbers[parseInt(index)] || match;
    });

    // Step 8 — fix any spaces inside numbers
    result = result.replace(/(\d)\.\s+(\d)/g, "$1.$2");
    result = result.replace(/(\d),\s+(\d)/g, "$1,$2");

    return result.trim();

  } catch(e) {
    console.error("Engine error:", e);
    return text;
  }
}
