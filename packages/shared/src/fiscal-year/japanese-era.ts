/**
 * Japanese Era (年号) Conversion Utilities
 * Converts between Western calendar years and Japanese era years
 */

export interface JapaneseEra {
  name: string;
  nameJa: string;
  startYear: number;
  endYear?: number; // undefined for current era
  startDate: Date;
  endDate?: Date;
}

/**
 * Japanese eras (Gengo)
 * Source: Official Japanese calendar system
 */
export const JAPANESE_ERAS: readonly JapaneseEra[] = [
  {
    name: 'Reiwa',
    nameJa: '令和',
    startYear: 2019,
    startDate: new Date('2019-05-01'),
  },
  {
    name: 'Heisei',
    nameJa: '平成',
    startYear: 1989,
    endYear: 2019,
    startDate: new Date('1989-01-08'),
    endDate: new Date('2019-04-30'),
  },
  {
    name: 'Showa',
    nameJa: '昭和',
    startYear: 1926,
    endYear: 1989,
    startDate: new Date('1926-12-25'),
    endDate: new Date('1989-01-07'),
  },
  {
    name: 'Taisho',
    nameJa: '大正',
    startYear: 1912,
    endYear: 1926,
    startDate: new Date('1912-07-30'),
    endDate: new Date('1926-12-24'),
  },
  {
    name: 'Meiji',
    nameJa: '明治',
    startYear: 1868,
    endYear: 1912,
    startDate: new Date('1868-01-25'),
    endDate: new Date('1912-07-29'),
  },
] as const;

export interface JapaneseYear {
  eraName: string;
  eraNameJa: string;
  eraYear: number;
  westernYear: number;
  formatted: string; // e.g., "令和5年"
  formattedRomaji: string; // e.g., "Reiwa 5"
}

/**
 * Get the Japanese era for a given date
 */
export function getJapaneseEra(date: Date): JapaneseEra | null {
  for (const era of JAPANESE_ERAS) {
    if (date >= era.startDate) {
      if (!era.endDate || date <= era.endDate) {
        return era;
      }
    }
  }
  return null;
}

/**
 * Convert Western year to Japanese era year
 * @param year - Western calendar year (e.g., 2024)
 * @param month - Month (1-12), optional for more accurate era determination
 * @param day - Day of month (1-31), optional for more accurate era determination
 */
export function toJapaneseYear(
  year: number,
  month?: number,
  day?: number
): JapaneseYear | null {
  // Create date for comparison
  const date = new Date(year, month ? month - 1 : 0, day || 1);
  const era = getJapaneseEra(date);

  if (!era) {
    return null;
  }

  // Calculate era year
  // For years that span multiple eras, we need to check the exact date
  let eraYear: number;

  if (month && day) {
    // Precise calculation
    const yearStart = new Date(year, 0, 1);
    if (yearStart < era.startDate) {
      // This year started in the previous era
      eraYear = 1;
    } else {
      eraYear = year - era.startYear + 1;
    }
  } else {
    // Approximate calculation (beginning of year)
    eraYear = year - era.startYear + 1;
  }

  return {
    eraName: era.name,
    eraNameJa: era.nameJa,
    eraYear,
    westernYear: year,
    formatted: `${era.nameJa}${eraYear}年`,
    formattedRomaji: `${era.name} ${eraYear}`,
  };
}

/**
 * Convert Japanese era year to Western year
 * @param eraName - Era name (e.g., "Reiwa" or "令和")
 * @param eraYear - Year within the era (e.g., 5)
 */
export function toWesternYear(eraName: string, eraYear: number): number | null {
  const era = JAPANESE_ERAS.find(
    (e) => e.name === eraName || e.nameJa === eraName
  );

  if (!era) {
    return null;
  }

  const westernYear = era.startYear + eraYear - 1;

  // Validate the year is within the era's range
  if (era.endYear && westernYear > era.endYear) {
    return null;
  }

  return westernYear;
}

/**
 * Format a date in Japanese era format
 * @param date - Date to format
 * @param format - Format type ('full', 'short', 'year-only')
 * @returns Formatted string (e.g., "令和5年12月3日" or "R5.12.3")
 */
export function formatJapaneseDate(
  date: Date,
  format: 'full' | 'short' | 'year-only' = 'full'
): string {
  const japaneseYear = toJapaneseYear(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  if (!japaneseYear) {
    return date.toLocaleDateString('ja-JP');
  }

  switch (format) {
    case 'full':
      // 令和5年12月3日
      return `${japaneseYear.formatted}${date.getMonth() + 1}月${date.getDate()}日`;

    case 'short':
      // R5.12.3
      return `${japaneseYear.eraName.charAt(0)}${japaneseYear.eraYear}.${date.getMonth() + 1}.${date.getDate()}`;

    case 'year-only':
      // 令和5年
      return japaneseYear.formatted;

    default:
      return japaneseYear.formatted;
  }
}

/**
 * Get the current Japanese era year
 */
export function getCurrentJapaneseYear(): JapaneseYear | null {
  const now = new Date();
  return toJapaneseYear(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Check if a year is in a specific era
 */
export function isYearInEra(year: number, eraName: string): boolean {
  const era = JAPANESE_ERAS.find(
    (e) => e.name === eraName || e.nameJa === eraName
  );

  if (!era) {
    return false;
  }

  if (era.endYear) {
    return year >= era.startYear && year <= era.endYear;
  }

  return year >= era.startYear;
}

/**
 * Get all available eras
 */
export function getAllEras(): readonly JapaneseEra[] {
  return JAPANESE_ERAS;
}

/**
 * Parse Japanese era date string
 * Supports formats like "令和5年12月3日", "R5.12.3", "Reiwa 5"
 */
export function parseJapaneseDate(dateStr: string): Date | null {
  // Try to match full format: 令和5年12月3日
  const fullMatch = dateStr.match(/([令平昭大明][和成治正])(\d+)年(\d+)月(\d+)日/);
  if (fullMatch?.[1] && fullMatch[2] && fullMatch[3] && fullMatch[4]) {
    const eraKanji = fullMatch[1];
    const eraYear = parseInt(fullMatch[2], 10);
    const month = parseInt(fullMatch[3], 10);
    const day = parseInt(fullMatch[4], 10);

    const westernYear = toWesternYear(eraKanji, eraYear);
    if (westernYear) {
      return new Date(westernYear, month - 1, day);
    }
  }

  // Try to match short format: R5.12.3
  const shortMatch = dateStr.match(/([RHSTM])(\d+)\.(\d+)\.(\d+)/);
  if (shortMatch?.[1] && shortMatch[2] && shortMatch[3] && shortMatch[4]) {
    const eraLetter = shortMatch[1];
    const eraYear = parseInt(shortMatch[2], 10);
    const month = parseInt(shortMatch[3], 10);
    const day = parseInt(shortMatch[4], 10);

    const eraMap: { [key: string]: string } = {
      R: 'Reiwa',
      H: 'Heisei',
      S: 'Showa',
      T: 'Taisho',
      M: 'Meiji',
    };

    const eraName = eraMap[eraLetter];
    if (eraName) {
      const westernYear = toWesternYear(eraName, eraYear);
      if (westernYear) {
        return new Date(westernYear, month - 1, day);
      }
    }
  }

  return null;
}
