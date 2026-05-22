function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") {
    return "";
  }

  var rewritten = text.replace(/\s+/g, " ").trim();

  rewritten = rewritten.replace(/\breported\b/gi, "showed");
  rewritten = rewritten.replace(/\bdemonstrates\b/gi, "shows");
  rewritten = rewritten.replace(/\bsignificant\b/gi, "meaningful");
  rewritten = rewritten.replace(/\bhowever\b/gi, "still");
  rewritten = rewritten.replace(/\bin addition\b/gi, "also");
  rewritten = rewritten.replace(/\bprimarily\b/gi, "mostly");
  rewritten = rewritten.replace(/\bincreased\b/gi, "moved higher");
  rewritten = rewritten.replace(/\bdecreased\b/gi, "moved lower");
  rewritten = rewritten.replace(/\boperating expenses\b/gi, "operating costs");
  rewritten = rewritten.replace(/\bgross margin\b/gi, "margin performance");
  rewritten = rewritten.replace(/\bfree cash flow\b/gi, "available cash flow");

  var sentences = rewritten
    .split(". ")
    .map(function(sentence) {
      return sentence.trim();
    })
    .filter(function(sentence) {
      return sentence.length > 0;
    });

  if (sentences.length >= 4) {
    var temp = sentences[1];
    sentences[1] = sentences[2];
    sentences[2] = temp;
  }

  var openers = {
    regular: "What this shows is that",
    "data-safe": "The data shows that",
    academic: "This suggests that",
    business: "From a business standpoint,",
    resume: "This reflects"
  };

  var opener = openers[mode] || openers.regular;

  sentences = sentences.map(function(sentence, index) {
    if (index === 2 && sentence.length > 40) {
      return opener + " " + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }

    return sentence;
  });

  rewritten = sentences.join(". ");

  if (rewritten && !/[.!?]$/.test(rewritten)) {
    rewritten += ".";
  }

  return rewritten.replace(/\s+/g, " ").trim();
}
