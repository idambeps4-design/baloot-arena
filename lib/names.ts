export function normalizeArabicPlayerName(value: string) {
  return value
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, " ");
}

export function isAbdullahSharif(value: string) {
  return normalizeArabicPlayerName(value) === "عبدالله شريف";
}
