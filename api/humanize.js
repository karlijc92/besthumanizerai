function cleanUp(text) {
  let t = text;

  // Fix number spacing bug first
  t = t.replace(/(\d+)\.\s+(\d)/g, "$1.$2");

  // Remove AI phrases by sentence
  let sentences = t.match(/[^.!?]+[.!?]+/g) || [t];

  const killPhrases = [
    /tells a different story/i,
    /complicated picture/i,
    /geography underneath/i,
    /complicates the narrative/i,
    /beneath the surface/i,
    /undercuts the/i,
    /where the real pressure/i,
    /what's actually happening/i,
    /harder to ignore/i,
    /regional weakness matters/i,
    /demand picture/i,
    /margin story/i,
    /top-line numbers/i,
    /worth paying attention/i,
    /conditions (continue to )?evolve/i,
    /picture here is/i,
    /narrative here/i,
    /some markets faced/i,
    /headwinds/i,
  ];

  sentences = sentences.filter(sentence => {
    return !killPhrases.some(pattern => pattern.test(sentence));
  });

  t = sentences.join(" ");

  t = t.replace(/\bFurthermore,\s*/gi, "");
  t = t.replace(/\bMoreover,\s*/gi, "");
  t = t.replace(/\bNotably,\s*/gi, "");
  t = t.replace(/\bIn conclusion,\s*/gi, "");
  t = t.replace(/\bIn summary,\s*/gi, "");
  t = t.replace(/\bTo summarize,\s*/gi, "");
  t = t.replace(/\bIt is worth noting that\s*/gi, "");
  t = t.replace(/\bThis demonstrates\b/gi, "shows");
  t = t.replace(/\bThis suggests\b/gi, "points to");
  t = t.replace(/\bThis indicates\b/gi, "means");
  t = t.replace(/\butilize[sd]?\b/gi, "use");
  t = t.replace(/\bleverage[sd]?\b/gi, "use");
  t = t.replace(/\bfacilitate[sd]?\b/gi, "help");
  t = t.replace(/\brobust\b/gi, "strong");
  t = t.replace(/\bpivotal\b/gi, "key");
  t = t.replace(/\bcrucial\b/gi, "important");
  t = t.replace(/\bunderscore[sd]?\b/gi, "show");
  t = t.replace(/\bdelve[sd]?\b/gi, "dig");
  t = t.replace(/\bmeaningful(ly)?\b/gi, "real");
  t = t.replace(/\bunderlying\b/gi, "actual");
  t = t.replace(/\bnarrative\b/gi, "story");
  t = t.replace(/\bheadwinds\b/gi, "pressure");
  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
