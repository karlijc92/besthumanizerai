function cleanupHumanizedText(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text;

  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");
  cleaned = cleaned.replace(/([.,;:!?])([A-Za-z])/g, "$1 $2");
  cleaned = cleaned.replace(/\.\s*\./g, ".");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+\)/g, ")");
  cleaned = cleaned.replace(/\(\s+/g, "(");

  cleaned = cleaned.replace(/(\$?\d+(?:\.\d+)?)(\s*)\.(\s*)([A-Za-z])/g, "$1. $4");
  cleaned = cleaned.replace(/(%)([A-Za-z])/g, "$1 $2");

  cleaned = cleaned
    .split(/(?<=[.!?])\s+/)
    .map(sentence => {
      const trimmed = sentence.trim();
      if (!trimmed) return "";
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .filter(Boolean)
    .join(" ");

  cleaned = cleaned.replace(/\bInterestingly,\s+interestingly,\s+/gi, "Interestingly, ");
  cleaned = cleaned.replace(/\bFrom a broader perspective,\s+from a broader perspective,\s+/gi, "From a broader perspective, ");
  cleaned = cleaned.replace(/\bIn practical terms,\s+in practical terms,\s+/gi, "In practical terms, ");

  return cleaned.trim();
}
