const BANNED = [
  "porn",
  "sex",
  "nude",
  "hookup",
  "fetish",
  "violence",
  "suicide",
];

export function isAdsenseSafe(text: string) {
  const lower = text.toLowerCase();
  return !BANNED.some((w) => lower.includes(w));
}
