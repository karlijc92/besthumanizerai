function deepHumanize(text, mode) {

  let rewritten =
    text.replace(/\s+/g, " ").trim();

  const phraseSwaps = [

    ["reported", "showed"],
    ["demonstrates", "shows"],
    ["significant", "meaningful"],
    ["therefore", "because of this"],
    ["however", "even so"],
    ["in addition", "also"],
    ["overall", "looking at everything together"],
    ["management stated", "management noted"],
    ["primarily", "mostly"],
    ["increased", "moved higher"],
    ["decreased", "moved lower"],
    ["the company", "the business"],
    ["net income", "profit"],
    ["operating expenses", "operating costs"],
    ["gross margin", "overall margin performance"]
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
      .map(s => s.trim())
      .filter(Boolean);

  const transitions = [

    "One thing that becomes noticeable is that",
    "Looking deeper into the results,",
    "Another important factor is that",
    "From a broader standpoint,",
    "What really stands out here is that",
    "A closer review also shows that",
    "At the same time,",
    "One detail worth paying attention to is that"
  ];

  let usedTransitions = [];

  sentences = sentences.map((sentence, index) => {

    if (sentence.length < 20) {
      return sentence;
    }

    if (Math.random() > 0.45) {

      sentence =
        sentence.replace(
          /, while/gi,
          ". At the same time,"
        );

      sentence =
        sentence.replace(
          /, because/gi,
          ". This partly happened because"
        );

      sentence =
        sentence.replace(
          /, and/gi,
          ". In addition,"
        );

      sentence =
        sentence.replace(
          /, which/gi,
          ". This also"
        );
    }

    if (
      index !== 0 &&
      Math.random() > 0.55
    ) {

      let available =
        transitions.filter(
          item =>
            !usedTransitions.includes(item)
        );

      if (available.length === 0) {
        usedTransitions = [];
        available = transitions;
      }

      const selected =
        available[
          Math.floor(
            Math.random() * available.length
          )
        ];

      usedTransitions.push(selected);

      sentence =
        selected +
        " " +
        sentence.charAt(0).toLowerCase() +
        sentence.slice(1);
    }

    if (
      sentence.length > 120 &&
      Math.random() > 0.5
    ) {

      const midpoint =
        Math.floor(sentence.length / 2);

      const commaIndex =
        sentence.indexOf(",", midpoint);

      if (commaIndex !== -1) {

        sentence =
          sentence.slice(0, commaIndex) +
          "." +
          sentence.slice(commaIndex + 1);
      }
    }

    return sentence;

  });

  if (sentences.length > 4) {

    const first =
      sentences.shift();

    sentences.splice(2, 0, first);
  }

  if (sentences.length > 5) {

    const last =
      sentences.pop();

    sentences.splice(1, 0, last);
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
        /What really stands out here is that/gi,
        "The findings further indicate that"
      );

    rewritten =
      rewritten.replace(
        /Looking deeper into the results,/gi,
        "Further analysis suggests that"
      );
  }

  if (mode === "business") {

    rewritten =
      rewritten.replace(
        /From a broader standpoint,/gi,
        "From a business perspective,"
      );

    rewritten =
      rewritten.replace(
        /A closer review also shows that/gi,
        "Operationally,"
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
        /What really stands out here is that/gi,
        "Notably,"
      );
  }

  return rewritten;
}
