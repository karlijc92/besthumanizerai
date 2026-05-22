let humanizeEngineCallCount = 0;

function aggressiveHumanize(text, mode) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const humanizeVariationCycle = Math.floor(humanizeEngineCallCount / 4) % 4;
  humanizeEngineCallCount++;

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
      "The main point is that",
      "What this really shows is that",
      "A closer look suggests that",
      "The important takeaway is that"
    ],
    "data-safe": [
      "The data shows that",
      "The numbers point to the fact that",
      "Based on the figures,",
      "The results suggest that"
    ],
    academic: [
      "This suggests that",
      "The evidence indicates that",
      "From an analytical perspective,",
      "This trend reflects"
    ],
    business: [
      "From a business standpoint,",
      "Operationally,",
      "For decision-makers,",
      "The business impact is that"
    ],
    resume: [
      "This experience shows that",
      "The result was that",
      "This reflects",
      "The work demonstrated that"
    ]
  };

  const starters = startersByMode[mode] || startersByMode.regular;

  sentences = sentences.map((sentence, index) => {
    let current = sentence;

    if (index > 0 && index % 3 === 1 && current.length > 35) {
      const starterIndex = (index + humanizeVariationCycle) % starters.length;
      const starter = starters[starterIndex];

      if (!current.toLowerCase().startsWith(starter.toLowerCase())) {
        current = starter + " " + current.charAt(0).toLowerCase() + current.slice(1);
      }
    }

    if (current.length > 150) {
      const words = current.split(" ");
      const splitPoint = Math.floor(words.length * 0.55);

      current =
        words.slice(0, splitPoint).join(" ") +
        ". " +
        words.slice(splitPoint).join(" ");
    }

    return current;
  });

  if (sentences.length >= 4) {
    if (humanizeVariationCycle === 0 || humanizeVariationCycle === 2) {
      const second = sentences[1];
      sentences[1] = sentences[2];
      sentences[2] = second;
    } else {
      const third = sentences[2];
      sentences[2] = sentences[3];
      sentences[3] = third;
    }
  }

  rewritten = sentences.join(" ");

  rewritten = rewritten.replace(/\bThe main point is that the main point is that\b/gi, "The main point is that");
  rewritten = rewritten.replace(/\bWhat this really shows is that what this really shows is that\b/gi, "What this really
