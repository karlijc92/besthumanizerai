// engine.js — BestHumanizerAI

const SYNONYMS = {
  "however": ["that said", "even so", "still", "but", "yet"],
  "additionally": ["also", "on top of that", "and", "plus"],
  "therefore": ["so", "as a result", "because of this", "which is why"],
  "subsequently": ["after that", "then", "next", "later"],
  "approximately": ["around", "about", "roughly", "close to"],
  "significant": ["notable", "real", "sharp", "solid"],
  "significant increase": ["real jump", "solid gain", "sharp rise"],
  "reported": ["posted", "recorded", "brought in", "logged"],
  "represented": ["made up", "accounted for", "came in at", "was"],
  "despite": ["even with", "though", "even though"],
  "contributed": ["brought in", "generated", "added"],
  "expansion": ["increase", "jump", "gain", "rise"],
  "declined": ["dropped", "fell", "slid", "came down"],
  "decline": ["drop", "fall", "slide", "dip"],
  "generated": ["brought in", "posted", "recorded", "pulled in"],
  "totaled": ["came to", "reached", "hit", "added up to"],
  "increased": ["rose", "climbed", "jumped", "went up"],
  "decreased": ["fell", "dropped", "slid", "came down"],
  "quarter": ["quarter", "three-month period", "Q"],
  "revenue": ["revenue", "sales", "income", "earnings"],
  "compared to": ["versus", "against", "relative to", "next to"],
  "year-over-year": ["from a year earlier", "compared to last year", "versus the prior year"],
  "prior year": ["year before", "previous year", "last year"],
  "same period": ["same stretch", "comparable period", "that same quarter"],
};

const AI_OPENERS = [
  "In conclusion,", "In summary,", "To summarize,", "Furthermore,",
  "Moreover,", "Notably,", "Overall,", "Ultimately,", "Clearly,",
  "It is worth noting that", "It's worth noting that",
  "This demonstrates", "This suggests", "This indicates",
  "This shows that", "This reflects", "This highlights"
];

const AI_WORDS = {
  "utilize": "use", "utilizes": "uses", "utilized": "used",
  "leverage": "use", "leverages": "uses", "leveraged": "used",
  "facilitate": "help", "facilitates": "helps", "facilitated": "helped",
  "robust": "strong", "pivotal": "key", "crucial": "important",
  "navigate": "manage", "underscore": "show", "underscores": "shows",
  "delve": "dig", "meaningful": "real", "meaningfully": "really",
  "underlying": "actual", "narrative": "story", "headwinds": "pressure",
  "landscape": "environment", "synergies": "benefits", "streamline": "simplify",
  "innovative": "new", "cutting-edge": "new", "state-of-the-art": "advanced",
  "going forward": "from here", "moving forward": "from here",
  "at this point in time": "now", "in the current environment": "right now",
  "it is important to note": "", "it should be noted": "",
  "demonstrates": "shows", "indicates": "shows", "suggests": "points to"
};

function protectNumbers(text) {
  const protected_items = [];
  const placeholder = "NUMPLACEHOLDER";
  
  // Protect numbers, percentages, dollar amounts, years, company names
  const pattern = /(\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?|\d+(?:\.\d+)?%|\b(?:19|20)\d{2}\b|\bQ[1-4]\s?(?:20|19)\d{2}\b|[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|trillion|thousand))?)/gi;
  
  let counter = 0;
  const result = text.replace(pattern, (match) => {
    protected_items.push(match);
    return `${placeholder}${counter++}${placeholder}`;
  });
  
  return { text: result, items: protected_items, placeholder };
}

function restoreNumbers(text, items, placeholder) {
  let result = text;
  items.forEach((item, i) => {
    result = result.replace(`${placeholder}${i}${placeholder}`, item);
  });
  // Fix any spaces that crept into numbers
  result = result.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  result = result.replace(/(\d),\s+(\d{3})/g, "$1,$2");
  return result;
}

function replaceAIWords(text) {
  let result = text;
  
  // Remove AI openers
  AI_OPENERS.forEach(opener => {
    const regex = new RegExp(opener.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'gi');
    result = result.replace(regex, '');
  });
  
  // Replace AI words
  Object.entries(AI_WORDS).forEach(([word, replacement]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, replacement);
  });
  
  return result;
}

function replaceSynonyms(text) {
  let result = text;
  Object.entries(SYNONYMS).forEach(([word, replacements]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, () => {
      return replacements[Math.floor(Math.random() * replacements.length)];
    });
  });
  return result;
}

function varysentences(text) {
  let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const result = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let s = sentences[i].trim();
    
    // Randomly split long sentences (over 35 words)
    const words = s.split(' ');
    if (words.length > 35 && Math.random() > 0.3) {
      const mid = Math.floor(words.length / 2);
      // Find a comma near the middle to split on
      let splitPoint = -1;
      for (let j = mid - 3; j < mid + 3; j++) {
        if (words[j] && words[j].endsWith(',')) {
          splitPoint = j;
          break;
        }
      }
      if (splitPoint > 0) {
        const first = words.slice(0, splitPoint + 1).join(' ');
        const second = words.slice(splitPoint + 1).join(' ');
        // Capitalize second sentence
        result.push(first.replace(/,$/, '.'));
        result.push(second.charAt(0).toUpperCase() + second.slice(1));
        continue;
      }
