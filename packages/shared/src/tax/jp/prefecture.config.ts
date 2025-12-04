/**
 * Japanese Prefectures (都道府県 - Todōfuken) Configuration
 * All 47 prefectures with codes and regional information
 * Task: W27-T4 - Japanese tax configuration
 */

export interface Prefecture {
  code: string; // JIS X 0401 code
  name: string; // English name
  nameJapanese: string; // Japanese name (Kanji)
  nameRomaji: string; // Romaji pronunciation
  region: string; // Geographic region
  capital: string; // Prefecture capital city
  isMetropolitan?: boolean; // Tokyo (都)
  isCircuit?: boolean; // Hokkaido (道)
  isUrbanPrefecture?: boolean; // Osaka, Kyoto (府)
}

/**
 * Geographic Regions of Japan
 */
export const JAPAN_REGIONS = {
  HOKKAIDO: 'Hokkaido',
  TOHOKU: 'Tōhoku',
  KANTO: 'Kantō',
  CHUBU: 'Chūbu',
  KANSAI: 'Kansai',
  CHUGOKU: 'Chūgoku',
  SHIKOKU: 'Shikoku',
  KYUSHU: 'Kyūshū',
} as const;

/**
 * All 47 Japanese Prefectures
 * Codes follow JIS X 0401 standard (01-47)
 */
export const JAPAN_PREFECTURES: readonly Prefecture[] = [
  // Hokkaido Region (北海道地方)
  {
    code: '01',
    name: 'Hokkaido',
    nameJapanese: '北海道',
    nameRomaji: 'Hokkaidō',
    region: JAPAN_REGIONS.HOKKAIDO,
    capital: 'Sapporo',
    isCircuit: true, // Only 道 (dō) prefecture
  },

  // Tohoku Region (東北地方)
  {
    code: '02',
    name: 'Aomori',
    nameJapanese: '青森県',
    nameRomaji: 'Aomori-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Aomori',
  },
  {
    code: '03',
    name: 'Iwate',
    nameJapanese: '岩手県',
    nameRomaji: 'Iwate-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Morioka',
  },
  {
    code: '04',
    name: 'Miyagi',
    nameJapanese: '宮城県',
    nameRomaji: 'Miyagi-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Sendai',
  },
  {
    code: '05',
    name: 'Akita',
    nameJapanese: '秋田県',
    nameRomaji: 'Akita-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Akita',
  },
  {
    code: '06',
    name: 'Yamagata',
    nameJapanese: '山形県',
    nameRomaji: 'Yamagata-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Yamagata',
  },
  {
    code: '07',
    name: 'Fukushima',
    nameJapanese: '福島県',
    nameRomaji: 'Fukushima-ken',
    region: JAPAN_REGIONS.TOHOKU,
    capital: 'Fukushima',
  },

  // Kanto Region (関東地方)
  {
    code: '08',
    name: 'Ibaraki',
    nameJapanese: '茨城県',
    nameRomaji: 'Ibaraki-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Mito',
  },
  {
    code: '09',
    name: 'Tochigi',
    nameJapanese: '栃木県',
    nameRomaji: 'Tochigi-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Utsunomiya',
  },
  {
    code: '10',
    name: 'Gunma',
    nameJapanese: '群馬県',
    nameRomaji: 'Gunma-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Maebashi',
  },
  {
    code: '11',
    name: 'Saitama',
    nameJapanese: '埼玉県',
    nameRomaji: 'Saitama-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Saitama',
  },
  {
    code: '12',
    name: 'Chiba',
    nameJapanese: '千葉県',
    nameRomaji: 'Chiba-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Chiba',
  },
  {
    code: '13',
    name: 'Tokyo',
    nameJapanese: '東京都',
    nameRomaji: 'Tōkyō-to',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Tokyo',
    isMetropolitan: true, // Only 都 (to) prefecture
  },
  {
    code: '14',
    name: 'Kanagawa',
    nameJapanese: '神奈川県',
    nameRomaji: 'Kanagawa-ken',
    region: JAPAN_REGIONS.KANTO,
    capital: 'Yokohama',
  },

  // Chubu Region (中部地方)
  {
    code: '15',
    name: 'Niigata',
    nameJapanese: '新潟県',
    nameRomaji: 'Niigata-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Niigata',
  },
  {
    code: '16',
    name: 'Toyama',
    nameJapanese: '富山県',
    nameRomaji: 'Toyama-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Toyama',
  },
  {
    code: '17',
    name: 'Ishikawa',
    nameJapanese: '石川県',
    nameRomaji: 'Ishikawa-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Kanazawa',
  },
  {
    code: '18',
    name: 'Fukui',
    nameJapanese: '福井県',
    nameRomaji: 'Fukui-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Fukui',
  },
  {
    code: '19',
    name: 'Yamanashi',
    nameJapanese: '山梨県',
    nameRomaji: 'Yamanashi-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Kofu',
  },
  {
    code: '20',
    name: 'Nagano',
    nameJapanese: '長野県',
    nameRomaji: 'Nagano-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Nagano',
  },
  {
    code: '21',
    name: 'Gifu',
    nameJapanese: '岐阜県',
    nameRomaji: 'Gifu-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Gifu',
  },
  {
    code: '22',
    name: 'Shizuoka',
    nameJapanese: '静岡県',
    nameRomaji: 'Shizuoka-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Shizuoka',
  },
  {
    code: '23',
    name: 'Aichi',
    nameJapanese: '愛知県',
    nameRomaji: 'Aichi-ken',
    region: JAPAN_REGIONS.CHUBU,
    capital: 'Nagoya',
  },

  // Kansai Region (関西地方)
  {
    code: '24',
    name: 'Mie',
    nameJapanese: '三重県',
    nameRomaji: 'Mie-ken',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Tsu',
  },
  {
    code: '25',
    name: 'Shiga',
    nameJapanese: '滋賀県',
    nameRomaji: 'Shiga-ken',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Otsu',
  },
  {
    code: '26',
    name: 'Kyoto',
    nameJapanese: '京都府',
    nameRomaji: 'Kyōto-fu',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Kyoto',
    isUrbanPrefecture: true, // 府 (fu)
  },
  {
    code: '27',
    name: 'Osaka',
    nameJapanese: '大阪府',
    nameRomaji: 'Ōsaka-fu',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Osaka',
    isUrbanPrefecture: true, // 府 (fu)
  },
  {
    code: '28',
    name: 'Hyogo',
    nameJapanese: '兵庫県',
    nameRomaji: 'Hyōgo-ken',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Kobe',
  },
  {
    code: '29',
    name: 'Nara',
    nameJapanese: '奈良県',
    nameRomaji: 'Nara-ken',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Nara',
  },
  {
    code: '30',
    name: 'Wakayama',
    nameJapanese: '和歌山県',
    nameRomaji: 'Wakayama-ken',
    region: JAPAN_REGIONS.KANSAI,
    capital: 'Wakayama',
  },

  // Chugoku Region (中国地方)
  {
    code: '31',
    name: 'Tottori',
    nameJapanese: '鳥取県',
    nameRomaji: 'Tottori-ken',
    region: JAPAN_REGIONS.CHUGOKU,
    capital: 'Tottori',
  },
  {
    code: '32',
    name: 'Shimane',
    nameJapanese: '島根県',
    nameRomaji: 'Shimane-ken',
    region: JAPAN_REGIONS.CHUGOKU,
    capital: 'Matsue',
  },
  {
    code: '33',
    name: 'Okayama',
    nameJapanese: '岡山県',
    nameRomaji: 'Okayama-ken',
    region: JAPAN_REGIONS.CHUGOKU,
    capital: 'Okayama',
  },
  {
    code: '34',
    name: 'Hiroshima',
    nameJapanese: '広島県',
    nameRomaji: 'Hiroshima-ken',
    region: JAPAN_REGIONS.CHUGOKU,
    capital: 'Hiroshima',
  },
  {
    code: '35',
    name: 'Yamaguchi',
    nameJapanese: '山口県',
    nameRomaji: 'Yamaguchi-ken',
    region: JAPAN_REGIONS.CHUGOKU,
    capital: 'Yamaguchi',
  },

  // Shikoku Region (四国地方)
  {
    code: '36',
    name: 'Tokushima',
    nameJapanese: '徳島県',
    nameRomaji: 'Tokushima-ken',
    region: JAPAN_REGIONS.SHIKOKU,
    capital: 'Tokushima',
  },
  {
    code: '37',
    name: 'Kagawa',
    nameJapanese: '香川県',
    nameRomaji: 'Kagawa-ken',
    region: JAPAN_REGIONS.SHIKOKU,
    capital: 'Takamatsu',
  },
  {
    code: '38',
    name: 'Ehime',
    nameJapanese: '愛媛県',
    nameRomaji: 'Ehime-ken',
    region: JAPAN_REGIONS.SHIKOKU,
    capital: 'Matsuyama',
  },
  {
    code: '39',
    name: 'Kochi',
    nameJapanese: '高知県',
    nameRomaji: 'Kōchi-ken',
    region: JAPAN_REGIONS.SHIKOKU,
    capital: 'Kochi',
  },

  // Kyushu Region (九州地方)
  {
    code: '40',
    name: 'Fukuoka',
    nameJapanese: '福岡県',
    nameRomaji: 'Fukuoka-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Fukuoka',
  },
  {
    code: '41',
    name: 'Saga',
    nameJapanese: '佐賀県',
    nameRomaji: 'Saga-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Saga',
  },
  {
    code: '42',
    name: 'Nagasaki',
    nameJapanese: '長崎県',
    nameRomaji: 'Nagasaki-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Nagasaki',
  },
  {
    code: '43',
    name: 'Kumamoto',
    nameJapanese: '熊本県',
    nameRomaji: 'Kumamoto-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Kumamoto',
  },
  {
    code: '44',
    name: 'Oita',
    nameJapanese: '大分県',
    nameRomaji: 'Ōita-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Oita',
  },
  {
    code: '45',
    name: 'Miyazaki',
    nameJapanese: '宮崎県',
    nameRomaji: 'Miyazaki-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Miyazaki',
  },
  {
    code: '46',
    name: 'Kagoshima',
    nameJapanese: '鹿児島県',
    nameRomaji: 'Kagoshima-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Kagoshima',
  },
  {
    code: '47',
    name: 'Okinawa',
    nameJapanese: '沖縄県',
    nameRomaji: 'Okinawa-ken',
    region: JAPAN_REGIONS.KYUSHU,
    capital: 'Naha',
  },
] as const;

/**
 * Prefecture lookup utilities
 */
export const JAPAN_PREFECTURE_LOOKUP = {
  byCode: (code: string): Prefecture | undefined => {
    return JAPAN_PREFECTURES.find(p => p.code === code);
  },

  byName: (name: string): Prefecture | undefined => {
    return JAPAN_PREFECTURES.find(
      p => p.name.toLowerCase() === name.toLowerCase() ||
          p.nameJapanese === name ||
          p.nameRomaji.toLowerCase() === name.toLowerCase()
    );
  },

  byRegion: (region: string): Prefecture[] => {
    return JAPAN_PREFECTURES.filter(p => p.region === region);
  },

  getAll: (): readonly Prefecture[] => {
    return JAPAN_PREFECTURES;
  },
} as const;

/**
 * Prefecture type classification
 */
export const JAPAN_PREFECTURE_TYPES = {
  TO: {
    count: 1,
    name: '都 (To) - Metropolis',
    prefectures: ['Tokyo'],
  },
  DO: {
    count: 1,
    name: '道 (Dō) - Circuit',
    prefectures: ['Hokkaido'],
  },
  FU: {
    count: 2,
    name: '府 (Fu) - Urban Prefecture',
    prefectures: ['Osaka', 'Kyoto'],
  },
  KEN: {
    count: 43,
    name: '県 (Ken) - Prefecture',
    prefectures: JAPAN_PREFECTURES
      .filter(p => !p.isMetropolitan && !p.isCircuit && !p.isUrbanPrefecture)
      .map(p => p.name),
  },
} as const;

/**
 * Major cities by prefecture
 * For tax office and business registration purposes
 */
export const JAPAN_MAJOR_CITIES = {
  '13': ['Tokyo', 'Shinjuku', 'Shibuya', 'Minato', 'Chiyoda'], // Tokyo
  '27': ['Osaka', 'Sakai'], // Osaka
  '23': ['Nagoya'], // Aichi
  '14': ['Yokohama', 'Kawasaki'], // Kanagawa
  '01': ['Sapporo'], // Hokkaido
  '40': ['Fukuoka', 'Kitakyushu'], // Fukuoka
  '26': ['Kyoto'], // Kyoto
  '28': ['Kobe'], // Hyogo
  '11': ['Saitama'], // Saitama
  '12': ['Chiba'], // Chiba
} as const;
