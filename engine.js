function aggressiveHumanize(text, mode) {
  let rewritten = text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["reported revenue growth", "showed stronger revenue performance"],
    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["therefore", "because of this"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "looking at the full picture"],
    ["during the same period", "around the same time"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["net income", "profitability"],
    ["operating expenses", "operating costs"],
    ["gross margin", "margin performance"],
    ["free cash flow", "available cash flow"],
    ["the company", "the business"]
  ];

  replacements.forEach(pair => {
    rewritten = rewritten.replace(new RegExp(pair[0], "gi"), pair[1]);
  });

  let sentences = rewritten
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  const softStarters = [
    "What stands out is that",
    "Looking at the numbers,",
    "One detail that matters is that",
    "The bigger picture is that",
    "A closer look shows that",
    "At the same time,",
    "Another point worth noting is that",
    "From a practical standpoint,"
  ];

  let usedStarters = [];

  sentences = sentences.map((sentence, index) => {
    if (sentence.length < 20) {
      return sentence;
    }

    if (sentence.length > 95) {
      sentence = sentence.replace(/, while/gi, ". Meanwhile,");
      sentence = sentence.replace(/, because/gi, ". This happened because");
      sentence = sentence.replace(/, and/gi, ". Also,");
      sentence = sentence.replace(/, which/gi, ". This also");
    }

    if (index !== 0 && Math.random() > 0.58) {
      let available = softStarters.filter(starter => !usedStarters.includes(starter));

      if (available.length === 0) {
        available = softStarters;
        usedStarters = [];
      }

      const starter = available[Math.floor(Math.random() * available.length)];
      usedStarters.push(starter);

      sentence = starter + " " + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }

    return sentence;
  });

  if (sentences.length > 3) {
    const first = sentences.splice(0, 1)[0];
    sentences.splice(2, 0, first);
  }

  if (sentences.length > 5) {
    const fifth = sentences.splice(4, 1)[0];
    sentences.splice(1, 0, fifth);
  }

  rewritten = sentences.join(" ");

  if (mode === "academic") {
    rewritten = rewritten.replace(/What stands out is that/gi, "The findings suggest that");
    rewritten = rewritten.replace(/Looking at the numbers,/gi, "From an analytical standpoint,");
    rewritten = rewritten.replace(/The bigger picture is that/gi, "This indicates that");
  }

  if (mode === "business") {
    rewritten = rewritten.replace(/What stands out is that/gi, "From a business standpoint,");
    rewritten = rewritten.replace(/The bigger picture is that/gi, "Operationally,");
  }

  if (mode === "resume") {
    rewritten = rewritten.replace(/\bthe business\b/gi, "the organization");
  }

  if (mode === "data-safe") {
    rewritten = rewritten.replace(/What stands out is that/gi, "Notably,");
  }

  return rewritten.replace(/\s+/g, " ").trim();
}
