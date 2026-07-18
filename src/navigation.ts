export function getPreviousCharacterIndex(currentIndex: number): number {
  return Math.max(0, currentIndex - 1);
}

export function getNextCharacterIndex(
  currentIndex: number,
  totalCharacters: number
): number {
  return Math.min(totalCharacters - 1, currentIndex + 1);
}

