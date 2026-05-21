function extractProtectedData(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const patterns = [
    /\$?\d+(?:,\d{3})*(?:\.\d+)?\s?(?:billion|million|thousand|trillion)?/gi,
    /\d+(?:\.\d+)?%/g,
    /\d{4}/g,
    /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g,
    /\([A-Za-z]+,\s?\d{4}\)/g
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

function compareProtectedData(originalText, rewrittenText) {
  const originalItems = extractProtectedData(originalText);
  const rewrittenItems = extractProtectedData(rewrittenText);

  const missingItems = originalItems.filter(
    (item) => !rewrittenText.includes(item)
  );

  return {
    originalItems,
    rewrittenItems,
    missingItems,
    isDataSafe: missingItems.length === 0
  };
}
