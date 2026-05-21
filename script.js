function deepHumanize(text, mode) {

  let rewritten =
    text.replace(/\s+/g, " ").trim();

  const phraseSwaps = [

    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["however", "still"],
    ["in addition", "also"],
    ["overall", "when viewed together"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["the company", "the business"],
    ["operating expenses", "operating costs"],
    ["net income", "profitability"],
    ["gross margin", "margin performance"]
  ];

  phraseSwaps.forEach(pair => {

    rewritten =
      rewritten.replace(
        new RegExp(pair[0], "gi"),
        pair[1]
      );
  });

  let sentences =
    rewritten
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);

  sentences = sentences.map(sentence => {

    if (sentence.length < 25) {
      return sentence;
    }

    if (Math.random() > 0.35) {

      sentence =
        sentence.replace(
          /, while/gi,
          ". Meanwhile,"
        );

      sentence =
        sentence.replace(
          /, because/gi,
          ". Part of the reason for this was"
        );

      sentence =
        sentence.replace(
          /, and/gi,
          ". In addition,"
        );
    }

    if (
      sentence.length > 90 &&
      Math.random() > 0.4
    ) {

      const words =
        sentence.split(" ");

      const midpoint =
        Math.floor(words.length / 2);

      const firstHalf =
        words.slice(0, midpoint).join(" ");

      const secondHalf =
        words.slice(midpoint).join(" ");

      sentence =
        firstHalf + ". " + secondHalf;
    }

    if (Math.random() > 0.45) {

      const sentenceStarters = [

        "One thing worth noting is that",
        "Looking more closely at the data,",
        "Another important detail is that",
        "What becomes noticeable here is that",
        "From a broader standpoint,"
      ];

      const chosen =
        sentenceStarters[
          Math.floor(
            Math.random() * sentenceStarters.length
          )
        ];

      sentence =
        chosen +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    return sentence;

  });

  if (sentences.length > 4) {

    const moved =
      sentences.shift();

    sentences.splice(2, 0, moved);
  }

  if (sentences.length > 5) {

    const movedLast =
      sentences.pop();

    sentences.splice(1, 0, movedLast);
  }

  rewritten =
    sentences.join(" ");

  rewritten =
    rewritten.replace(/\s+/g, " ").trim();

  rewritten =
    rewritten.replace(/\.\s+\./g, ".");

  rewritten =
    rewritten.replace(/\s+,/g, ",");

  rewritten =
    rewritten.replace(/\s+\./g, ".");

  if (mode === "academic") {

    rewritten =
      rewritten.replace(
        /One thing worth noting is that/gi,
        "The findings suggest that"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /From a broader standpoint,/gi,
        "From a business perspective,"
      );
  }

  if (mode === "resume") {

    rewritten =
      rewritten.replace(
        /\bthe business\b/gi,
        "the organization"
      );
  }

  if (mode === "data-safe") {

    rewritten =
      rewritten.replace(
        /What becomes noticeable here is that/gi,
        "Notably,"
      );
  }

  return rewritten;
}
