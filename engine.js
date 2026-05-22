function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let rewritten = text.replace(/\s+/g, " ").trim();

  const replacements = [
    ["reported revenue growth", "showed stronger revenue performance"],
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
    ["operating expenses", "operating costs"],
    ["gross margin", "margin performance"],
    ["free cash flow", "available cash flow"]
  ];

  replacements.forEach(([from, to]) => {
    rewritten = rewritten.replace(new RegExp("\\b" + from + "\\b", "gi"), to);
  });

  let sentences = rewritten
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  const startersByMode = {
    regular: [
      "What stands out is that",
      "The larger takeaway is that",
      "A closer reading shows that",
      "The key point is that",
      "In plain terms,"
    ],
    "data-safe": [
      "The data shows that",
      "The numbers suggest that",
      "Based on the figures,",
      "The results point to",
      "In practical terms,"
    ],
    academic: [
      "This suggests that",
      "The evidence indicates that",
      "From an analytical perspective,",
      "This trend reflects",
      "The findings point to"
    ],
    business: [
      "From a business standpoint,",
      "Operationally,",
      "For decision-makers,",
      "The business impact is that",
      "From a performance view,"
    ],
    resume: [
      "This experience shows that",
      "The result was that",
      "This reflects",
      "The work demonstrated that",
      "This highlights"
    ]
  };

  const starters = startersByMode[mode] || startersByMode.regular;
  const usedStarters = [];

  function pickStarter() {
    const available = starters.filter(starter => !usedStarters.includes(starter));
    const pool = available.length ? available : starters;
    const starter = pool[Math.floor(Math.random() * pool.length)];

    usedStarters.push(starter);

    if (usedStarters.length > 3) {
      usedStarters.shift();
    }

    return starter;
  }

  sentences = sentences.map((sentence, index) => {
    let current = sentence;

    if (current.length > 110) {
      const splitOptions = [
        [/, while\s+/i, ". At the same time, "],
        [/, because\s+/i, ". This happened because "],
        [/, which\s+/i, ". This also "],
        [/, and\s+/i, ". Also, "]
      ];

      splitOptions.forEach(([pattern, replacement]) => {
        if (Math.random() > 0.45) {
          current = current.replace(pattern, replacement);
        }
      });
    }

    if (index > 0 && current.length > 45 && Math.random() > 0.62) {
      const starter = pickStarter();

      if (!current.toLowerCase().startsWith(starter.toLowerCase())) {
        current = starter + " " + current.charAt(0).toLowerCase() + current.slice(1);
      }
    }

    if (current.length > 155 && Math.random() > 0.35) {
      const words = current.split(" ");
      const splitPoint = Math.floor(words.length * (0.45 + Math.random() * 0.2));

      current =
        words.slice(0, splitPoint).join(" ") +
        ". " +
        words.slice(splitPoint).join(" ");
    }

    return current;
  });

  if (sentences.length >= 4 && Math.random() > 0.5) {
    const second = sentences[1];
    sentences[1] = sentences[2];
    sentences[2] = second;
  }

  if (sentences.length >= 6 && Math.random() > 0.55) {
    const fifth = sentences[4];
    sentences[4] = sentences[5];
    sentences[5] = fifth;
  }

  rewritten = sentences.join(" ");

  rewritten = rewritten.replace(/\b(What stands out is that|The larger takeaway is that|A closer reading shows that|The key point is that|The data shows that|The numbers suggest that|This suggests that|The evidence indicates that)\s+\1\b/gi, "$1");

  return rewritten.replace(/\s+/g, " ").trim();
}
