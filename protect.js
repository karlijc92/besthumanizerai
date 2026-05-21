function extractProtectedData(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const patterns = [
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi,
    /\d+(?:\.\d+)?%/g,
    /\b(?:19|20)\d{2}\b/g,
    /\bQ[1-4]\s?(?:19|20)\d{2}\b/gi,
    /\([A-Za-z]+,\s?(?:19|20)\d{2}\)/g,
    /\b\d+(?:\.\d+)?\s?(?:to|-|–)\s?\$?\d+(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi
  ];

  const protectedItems = [];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern);

    if (matches) {
      matches.forEach((match) => {
        const cleanMatch = match.trim();

        if (cleanMatch && !protectedItems.includes(cleanMatch)) {
          protectedItems.push(cleanMatch);
        }
      });
    }
  });

  return protectedItems;
}

function normalizeProtectedValue(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+%/g, "%")
    .replace(/\$\s+/g, "$")
    .trim();
}

function compareProtectedData(originalText, rewrittenText) {
  const originalItems = extractProtectedData(originalText).map(normalizeProtectedValue);
  const normalizedRewrite = normalizeProtectedValue(rewrittenText);

  const missingItems = originalItems.filter((item) => {
    return !normalizedRewrite.includes(item);
  });

  return {
    originalItems,
    missingItems,
    isDataSafe: missingItems.length === 0
  };
}
