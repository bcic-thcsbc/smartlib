export const phonePrefixes = new Set([
  "032", "033", "034", "035", "036", "037", "038", "039", "052", "056", "058", "059",
  "070", "076", "077", "078", "079", "081", "082", "083", "084", "085", "086", "087",
  "088", "089", "090", "091", "092", "093", "094", "096", "097", "098", "099",
]);

export const normalizeClassName = (value: string) => value.trim().toUpperCase();
export const validClassName = (value: string) => /^[6-9]A[1-9]\d*$/.test(normalizeClassName(value));
export const validPhone = (value: string) => /^0\d{9}$/.test(value.trim()) && phonePrefixes.has(value.trim().slice(0, 3));
