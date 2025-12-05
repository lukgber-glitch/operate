/**
 * Hijri Calendar Support
 *
 * Provides utilities for working with the Islamic (Hijri) calendar:
 * - Gregorian to Hijri conversion
 * - Hijri to Gregorian conversion
 * - Hijri date formatting
 * - Hijri month and day names
 */

// Hijri month names in Arabic
export const HIJRI_MONTHS_AR = [
  'محرم',      // Muharram
  'صفر',       // Safar
  'ربيع الأول', // Rabi' al-awwal
  'ربيع الآخر', // Rabi' al-thani
  'جمادى الأولى', // Jumada al-awwal
  'جمادى الآخرة', // Jumada al-thani
  'رجب',       // Rajab
  'شعبان',     // Sha'ban
  'رمضان',     // Ramadan
  'شوال',      // Shawwal
  'ذو القعدة', // Dhu al-Qi'dah
  'ذو الحجة',  // Dhu al-Hijjah
];

// Hijri month names in English
export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

// Day names in Arabic
export const HIJRI_DAYS_AR = [
  'الأحد',    // Sunday
  'الإثنين',  // Monday
  'الثلاثاء', // Tuesday
  'الأربعاء', // Wednesday
  'الخميس',   // Thursday
  'الجمعة',   // Friday
  'السبت',    // Saturday
];

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;   // 1-29/30
}

/**
 * Convert Gregorian date to Hijri date
 * Uses the Umm al-Qura calendar algorithm
 *
 * @param date - Gregorian date to convert
 * @returns Hijri date object
 */
export function gregorianToHijri(date: Date): HijriDate {
  // Julian Day Number calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Convert JDN to Hijri
  let l = jdn - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;

  const hijriMonth = Math.floor((24 * l) / 709);
  const hijriDay = l - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay,
  };
}

/**
 * Convert Hijri date to Gregorian date
 *
 * @param hijriDate - Hijri date to convert
 * @returns Gregorian Date object
 */
export function hijriToGregorian(hijriDate: HijriDate): Date {
  const { year, month, day } = hijriDate;

  // Calculate Julian Day Number from Hijri
  let jdn =
    Math.floor((11 * year + 3) / 30) +
    354 * year +
    30 * month -
    Math.floor((month - 1) / 2) +
    day +
    1948440 -
    385;

  // Convert JDN to Gregorian
  let a = jdn + 32044;
  let b = Math.floor((4 * a + 3) / 146097);
  let c = a - Math.floor((146097 * b) / 4);
  let d = Math.floor((4 * c + 3) / 1461);
  let e = c - Math.floor((1461 * d) / 4);
  let m = Math.floor((5 * e + 2) / 153);

  const gregorianDay = e - Math.floor((153 * m + 2) / 5) + 1;
  const gregorianMonth = m + 3 - 12 * Math.floor(m / 10);
  const gregorianYear = 100 * b + d - 4800 + Math.floor(m / 10);

  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
}

/**
 * Format Hijri date in Arabic
 *
 * @param hijriDate - Hijri date to format
 * @param options - Formatting options
 * @returns Formatted Hijri date string
 */
export function formatHijriDate(
  hijriDate: HijriDate,
  options: {
    locale?: 'ar' | 'en';
    format?: 'full' | 'long' | 'medium' | 'short';
    useArabicIndic?: boolean;
  } = {}
): string {
  const { locale = 'ar', format = 'medium', useArabicIndic = false } = options;

  const monthNames = locale === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
  const monthName = monthNames[hijriDate.month - 1];

  const day = hijriDate.day.toString();
  const year = hijriDate.year.toString();

  const arabicIndic = (text: string) => {
    if (!useArabicIndic) return text;
    const map: Record<string, string> = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
    };
    return text.replace(/[0-9]/g, (d) => map[d] || d);
  };

  if (locale === 'ar') {
    switch (format) {
      case 'full':
        return `${arabicIndic(day)} ${monthName} ${arabicIndic(year)} هـ`;
      case 'long':
        return `${arabicIndic(day)} ${monthName} ${arabicIndic(year)} هـ`;
      case 'medium':
        return `${arabicIndic(day)} ${monthName} ${arabicIndic(year)}`;
      case 'short':
        return `${arabicIndic(day)}/${arabicIndic(hijriDate.month.toString())}/${arabicIndic(year)}`;
      default:
        return `${arabicIndic(day)} ${monthName} ${arabicIndic(year)}`;
    }
  } else {
    switch (format) {
      case 'full':
        return `${day} ${monthName} ${year} AH`;
      case 'long':
        return `${day} ${monthName} ${year} AH`;
      case 'medium':
        return `${day} ${monthName} ${year}`;
      case 'short':
        return `${day}/${hijriDate.month}/${year}`;
      default:
        return `${day} ${monthName} ${year}`;
    }
  }
}

/**
 * Get current Hijri date
 *
 * @returns Current Hijri date
 */
export function getCurrentHijriDate(): HijriDate {
  return gregorianToHijri(new Date());
}

/**
 * Get Hijri month name
 *
 * @param month - Month number (1-12)
 * @param locale - Locale for month name
 * @returns Month name
 */
export function getHijriMonthName(
  month: number,
  locale: 'ar' | 'en' = 'ar'
): string {
  const months = locale === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
  return months[month - 1] || '';
}

/**
 * Get Hijri day name
 *
 * @param date - Date to get day name for
 * @param locale - Locale for day name
 * @returns Day name
 */
export function getHijriDayName(
  date: Date,
  locale: 'ar' | 'en' = 'ar'
): string {
  const dayIndex = date.getDay();
  if (locale === 'ar') {
    return HIJRI_DAYS_AR[dayIndex]!;
  } else {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex]!;
  }
}

/**
 * Check if a Hijri year is a leap year
 * In the Hijri calendar, a leap year has 355 days instead of 354
 *
 * @param year - Hijri year
 * @returns True if leap year
 */
export function isHijriLeapYear(year: number): boolean {
  return (11 * year + 14) % 30 < 11;
}

/**
 * Get number of days in a Hijri month
 *
 * @param year - Hijri year
 * @param month - Hijri month (1-12)
 * @returns Number of days in the month
 */
export function getHijriMonthDays(year: number, month: number): number {
  // Odd months have 30 days, even months have 29
  // Exception: Last month (12) has 30 days in leap years
  if (month < 12) {
    return month % 2 === 1 ? 30 : 29;
  } else {
    return isHijriLeapYear(year) ? 30 : 29;
  }
}

/**
 * Add days to a Hijri date
 *
 * @param hijriDate - Starting Hijri date
 * @param days - Number of days to add
 * @returns New Hijri date
 */
export function addHijriDays(hijriDate: HijriDate, days: number): HijriDate {
  const gregorian = hijriToGregorian(hijriDate);
  gregorian.setDate(gregorian.getDate() + days);
  return gregorianToHijri(gregorian);
}

/**
 * Add months to a Hijri date
 *
 * @param hijriDate - Starting Hijri date
 * @param months - Number of months to add
 * @returns New Hijri date
 */
export function addHijriMonths(hijriDate: HijriDate, months: number): HijriDate {
  let { year, month, day } = hijriDate;

  month += months;

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  // Adjust day if it exceeds the number of days in the new month
  const maxDays = getHijriMonthDays(year, month);
  if (day > maxDays) {
    day = maxDays;
  }

  return { year, month, day };
}

/**
 * Format a date showing both Gregorian and Hijri
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted dual calendar string
 */
export function formatDualCalendar(
  date: Date,
  options: {
    locale?: 'ar' | 'en';
    useArabicIndic?: boolean;
  } = {}
): string {
  const { locale = 'ar', useArabicIndic = false } = options;

  const hijri = gregorianToHijri(date);
  const hijriFormatted = formatHijriDate(hijri, { locale, useArabicIndic });

  const gregorianOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const gregorianFormatted = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-SA' : 'en-US',
    gregorianOptions
  ).format(date);

  if (locale === 'ar') {
    return `${gregorianFormatted} (${hijriFormatted})`;
  } else {
    return `${gregorianFormatted} (${hijriFormatted})`;
  }
}

export default {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  getCurrentHijriDate,
  getHijriMonthName,
  getHijriDayName,
  isHijriLeapYear,
  getHijriMonthDays,
  addHijriDays,
  addHijriMonths,
  formatDualCalendar,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  HIJRI_DAYS_AR,
};
