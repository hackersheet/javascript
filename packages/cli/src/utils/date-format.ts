/**
 * Pads a number with leading zeros to reach the specified length.
 *
 * @param n - The number to pad.
 * @param length - The desired string length (default: 2).
 * @returns The padded string representation.
 */
export function padZero(n: number, length: number = 2): string {
  return String(n).padStart(length, '0');
}

/**
 * Date components extracted from a Date object.
 */
export type DateComponents = {
  /** Four-digit year. */
  yyyy: string;
  /** Two-digit month (01-12). */
  mm: string;
  /** Two-digit day of month (01-31). */
  dd: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Datetime string (YYYY-MM-DD HH:MM:SS). */
  datetime: string;
};

/**
 * Extracts formatted date components from a Date object.
 *
 * @param now - The Date object to extract components from (defaults to current date/time).
 * @returns An object containing formatted date components.
 */
export function getDateComponents(now: Date = new Date()): DateComponents {
  const yyyy = now.getFullYear().toString();
  const mm = padZero(now.getMonth() + 1);
  const dd = padZero(now.getDate());
  const date = `${yyyy}-${mm}-${dd}`;
  const datetime = `${date} ${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;

  return { yyyy, mm, dd, date, datetime };
}
