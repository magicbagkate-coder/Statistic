const SOURCE_WORDS = ['инстаграм', 'instagram', 'фейсбук', 'facebook', 'вайбер', 'viber', 'телеграм', 'telegram', 'тикток', 'tiktok'];
const WORD = /[a-zа-яё]+/g;
const SHORT_WORD_LENGTH = 5;
const LONG_WORD_LENGTH = 7;

/** The number of single letter changes (adding, removing, replacing one letter) that turn one word into the other. */
function editDistance(first: string, second: string): number {
  let previous = Array.from({ length: second.length + 1 }, (_unused, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      const replace = previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1);
      current.push(Math.min(replace, previous[column] + 1, current[column - 1] + 1));
    }
    previous = current;
  }
  return previous[second.length];
}

/** Longer words may have more typos; short words are left as they are. */
function allowedMistakes(word: string): number {
  if (word.length >= LONG_WORD_LENGTH) return 2;
  return word.length >= SHORT_WORD_LENGTH ? 1 : 0;
}

function closestSourceWord(word: string): string {
  const mistakes = allowedMistakes(word);
  if (mistakes === 0) return word;
  return SOURCE_WORDS.find((source) => editDistance(word, source) <= mistakes) ?? word;
}

/** Fixes typos in the names of the sources ("інтсаграм" → "инстаграм"), so a mistyped line is still understood. Expects lower case text. */
export function correctSourceWords(text: string): string {
  return text.replace(WORD, closestSourceWord);
}
