/**
 * Converts a value to a number, returning null if the conversion fails.
 */
export const toInt = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  return isNaN(num) ? null : num;
};

/**
 * Converts a value to a boolean integer (1 for true, 0 for false).
 */
export const toBooleanInt = (v: any): number =>
  String(v).toLowerCase() === "true" ? 1 : 0;