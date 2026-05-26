function aggressiveHumanize(text, mode) {

  let working = text;

  const introStarters = [
    "From a broader perspective,",
    "Looking at the situation overall,",
    "In practical terms,",
    "What stands out most is that",
    "The larger takeaway is that",
    "At the same time,",
    "From an operational standpoint,",
    "What becomes clear here is that"
  ];

  const transitions = [
    "At the same time,",
    "Meanwhile,",
    "In addition,",
    "Because of this,",
    "As a result,",
    "Even so,",
    "That said,",
    "On top of that,"
  ];

  const humanPhrases = [
    ["demonstrates", "points to"],
    ["demonstrate", "point to"],
    ["indicates", "suggests"],
    ["indicate", "suggest"],
    ["shows", "reflects"],
    ["show", "reflect"],
    ["therefore", "because of this"],
    ["furthermore", "also"],
    ["moreover", "on top of that"],
    ["significant", "meaningful"],
    ["substantial", "major"],
    ["utilize", "use"],
    ["utilizes", "uses"],
    ["in conclusion", "overall"],
    ["the company", "the business"],
    ["the data", "the figures"]
  ];

  humanPhrases.forEach(function(pair) {
    const regex = new RegExp("\\b" + pair[0] + "\\b", "gi");
    working = working.replace(regex, pair[1]);
  });

  let sentences = working
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  let rebuilt = [];

  sentences.forEach(function(sentence, index) {

    let s = sentence.trim();

    if (index === 0) {

      if (Math.random() > 0.5) {
        s = introStarters[Math.floor(Math.random() * introStarters.length)] + " " + lowerFirstLetter(s);
      }

      rebuilt.push(s);
      return;
    }

    if (index % 2 === 0) {

      const transition =
        transitions[Math.floor(Math.random() * transitions.length)];

      s = transition + " " + lowerFirstLetter(s);
    }

    if (s.length > 140) {

      const commaParts = s.split(",");

      if (commaParts.length >= 3) {

        const firstHalf =
          commaParts.slice(0, 2).join(",").trim();

        const secondHalf =
          commaParts.slice(2).join(",").trim();

        s =
          firstHalf + ". " +
          capitalizeFirst(secondHalf);
      }
    }

    rebuilt.push(s);
  });

  let result = rebuilt.join(" ");

  result = result.replace(
    /\bnet income improved\b/gi,
    "net income moved higher"
  );

  result = result.replace(
    /\boperating margin expanded\b/gi,
    "operating margin widened"
  );

  result = result.replace(
    /\bcustomer retention improved\b/gi,
    "customer retention climbed"
  );

  result = result.replace(
    /\bwhich suggests\b/gi,
    "which points to"
  );

  result = result.replace(
    /\brepresenting a\b/gi,
    "which amounted to a"
  );

  result = result.replace(
    /\byear over year\b/gi,
    "compared with the prior year"
  );

  if (mode === "academic") {

    result = result.replace(/\bmajor\b/gi, "substantial");
    result = result.replace(/\breflects\b/gi, "suggests");
  }

  if (mode === "plain") {

    result = result.replace(/\bsubstantial\b/gi, "large");
    result = result.replace(/\boperational standpoint\b/gi, "practical standpoint");
  }

  result = result.replace(/\s+/g, " ").trim();

  return result;
}

function capitalizeFirst(text) {

  if (!text || text.length === 0) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}
