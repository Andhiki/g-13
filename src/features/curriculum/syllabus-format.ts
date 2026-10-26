export function syllabusPoints(text: string): string[] {
  const numbered = /^1\.\s/.test(text);
  return text
    .split(numbered ? /;\s*|(?:^|\s)\d+\.\s+/ : /;\s*/)
    .map((point) => point.trim())
    .filter(Boolean);
}
