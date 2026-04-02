/**
 * Date Utilities
 * 
 * Centralised helpers for parsing and formatting date strings.
 * 
 * The core problem: `new Date("2025-03-31")` is parsed as UTC midnight.
 * When local-timezone methods like `.getDate()` or `.toLocaleDateString()`
 * are called, the date shifts back one day for users west of UTC (e.g. PDT = UTC-7).
 * 
 * Solution: Always append `T00:00:00` so the date is parsed as LOCAL midnight.
 */

/**
 * Parse a YYYY-MM-DD (or ISO) date string as LOCAL midnight.
 * Safe to call with any date string — falls back to standard parsing for non-YYYY-MM-DD formats.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  // If it's a plain YYYY-MM-DD string (no time component), append T00:00:00
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  // Otherwise parse as-is (ISO strings with time, etc.)
  return new Date(dateStr);
}

/**
 * Format a YYYY-MM-DD date string as MM/DD/YYYY in local timezone.
 * This is the primary display format used in reports.
 */
export function formatDateLocal(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

/**
 * Format a YYYY-MM-DD date string as a short display (e.g., "Mar 31, 2025").
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate age in months and days between two YYYY-MM-DD date strings.
 * Uses local timezone parsing to avoid off-by-one errors.
 */
export function calculateAge(dob: string, testDate: string): { months: number; days: number } {
  if (!dob || !testDate) return { months: 0, days: 0 };
  const birth = parseLocalDate(dob);
  const test = parseLocalDate(testDate);
  if (isNaN(birth.getTime()) || isNaN(test.getTime())) return { months: 0, days: 0 };
  let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
  let days = test.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
    days += prevMonth.getDate();
  }
  return { months: Math.max(0, months), days: Math.max(0, days) };
}

/**
 * Calculate total days between two YYYY-MM-DD date strings.
 * Uses local timezone parsing.
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 * Replacement for `new Date().toISOString().split('T')[0]` which uses UTC.
 */
export function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
