/**
 * Static Hindu panchang / festival calendar for the Utsav Calendar widget.
 *
 * Dates are based on standard North-Indian Drik Panchang for 2026. For a
 * production deployment this would be swapped for a live panchang API call —
 * but the lunar calendar drift is small (±1 day region-to-region) and a
 * curated static list is more reliable than a flaky 3rd-party API for the
 * audiences ShareChat actually serves.
 */

export type FestivalTier = 'major' | 'observance';

export type FestivalKind =
  | 'ekadashi'
  | 'purnima'
  | 'amavasya'
  | 'jayanti'
  | 'vrat'
  | 'festival';

export interface Festival {
  id: string;
  /** ISO date, YYYY-MM-DD, local Indian calendar day */
  date: string;
  nameEn: string;
  nameHi: string;
  /** One-line significance in Hindi, shown on tap / hover */
  significanceHi: string;
  emoji: string;
  kind: FestivalKind;
  tier: FestivalTier;
}

/**
 * Curated set covering ~6 weeks from May 12 2026. Heavy weighting toward
 * devotional observances (Ekadashi, Pradosh, Purnima) since that's where
 * ShareChat over-indexes vs. mainstream news apps.
 */
export const FESTIVALS_2026: Festival[] = [
  {
    id: 'mohini-ekadashi-2026',
    date: '2026-05-12',
    nameEn: 'Mohini Ekadashi',
    nameHi: 'मोहिनी एकादशी',
    significanceHi: 'विष्णु के मोहिनी रूप का व्रत — पापों से मुक्ति का दिन',
    emoji: '🌸',
    kind: 'ekadashi',
    tier: 'major',
  },
  {
    id: 'pradosh-vrat-may-2026-shukla',
    date: '2026-05-13',
    nameEn: 'Pradosh Vrat',
    nameHi: 'प्रदोष व्रत',
    significanceHi: 'भगवान शिव की संध्या-आराधना का व्रत',
    emoji: '🕉️',
    kind: 'vrat',
    tier: 'observance',
  },
  {
    id: 'narasimha-jayanti-2026',
    date: '2026-05-14',
    nameEn: 'Narasimha Jayanti',
    nameHi: 'नरसिंह जयंती',
    significanceHi: 'विष्णु के चौथे अवतार नरसिंह का प्रकटोत्सव',
    emoji: '🦁',
    kind: 'jayanti',
    tier: 'major',
  },
  {
    id: 'buddha-purnima-2026',
    date: '2026-05-16',
    nameEn: 'Buddha Purnima',
    nameHi: 'बुद्ध पूर्णिमा',
    significanceHi: 'गौतम बुद्ध का जन्म, ज्ञान-प्राप्ति और निर्वाण — तीनों इसी दिन',
    emoji: '🪷',
    kind: 'purnima',
    tier: 'major',
  },
  {
    id: 'narada-jayanti-2026',
    date: '2026-05-17',
    nameEn: 'Narada Jayanti',
    nameHi: 'नारद जयंती',
    significanceHi: 'देवर्षि नारद का प्रकटोत्सव — पत्रकारिता और संगीत के संरक्षक',
    emoji: '🪕',
    kind: 'jayanti',
    tier: 'observance',
  },
  {
    id: 'sankashti-chaturthi-may-2026',
    date: '2026-05-20',
    nameEn: 'Sankashti Chaturthi',
    nameHi: 'संकष्टी चतुर्थी',
    significanceHi: 'गणेश जी का व्रत — संकटों के नाश के लिए',
    emoji: '🐘',
    kind: 'vrat',
    tier: 'observance',
  },
  {
    id: 'apara-ekadashi-2026',
    date: '2026-05-26',
    nameEn: 'Apara Ekadashi',
    nameHi: 'अपरा एकादशी',
    significanceHi: 'अपार पुण्य देने वाली एकादशी — विष्णु को समर्पित',
    emoji: '🌺',
    kind: 'ekadashi',
    tier: 'major',
  },
  {
    id: 'pradosh-vrat-may-2026-krishna',
    date: '2026-05-27',
    nameEn: 'Pradosh Vrat',
    nameHi: 'प्रदोष व्रत',
    significanceHi: 'कृष्ण पक्ष का प्रदोष — शिव-पार्वती की कृपा',
    emoji: '🕉️',
    kind: 'vrat',
    tier: 'observance',
  },
  {
    id: 'masik-shivaratri-may-2026',
    date: '2026-05-28',
    nameEn: 'Masik Shivaratri',
    nameHi: 'मासिक शिवरात्रि',
    significanceHi: 'मासिक शिव-आराधना की रात्रि',
    emoji: '🔱',
    kind: 'vrat',
    tier: 'observance',
  },
  {
    id: 'vat-savitri-2026',
    date: '2026-05-30',
    nameEn: 'Vat Savitri Vrat',
    nameHi: 'वट सावित्री व्रत',
    significanceHi: 'सुहागिन स्त्रियों का वट वृक्ष की पूजा — पति की दीर्घायु',
    emoji: '🌳',
    kind: 'vrat',
    tier: 'major',
  },
  {
    id: 'shani-jayanti-2026',
    date: '2026-05-30',
    nameEn: 'Shani Jayanti',
    nameHi: 'शनि जयंती',
    significanceHi: 'शनिदेव का प्रकटोत्सव — साढ़ेसाती से राहत का दिन',
    emoji: '🪐',
    kind: 'jayanti',
    tier: 'major',
  },
  {
    id: 'jyeshtha-amavasya-2026',
    date: '2026-05-30',
    nameEn: 'Jyeshtha Amavasya',
    nameHi: 'ज्येष्ठ अमावस्या',
    significanceHi: 'पितरों के तर्पण की अमावस्या',
    emoji: '🌑',
    kind: 'amavasya',
    tier: 'observance',
  },
  {
    id: 'vinayaka-chaturthi-jun-2026',
    date: '2026-06-05',
    nameEn: 'Vinayaka Chaturthi',
    nameHi: 'विनायक चतुर्थी',
    significanceHi: 'गणेश जी का शुक्ल पक्ष व्रत',
    emoji: '🐘',
    kind: 'vrat',
    tier: 'observance',
  },
  {
    id: 'ganga-dussehra-2026',
    date: '2026-06-11',
    nameEn: 'Ganga Dussehra',
    nameHi: 'गंगा दशहरा',
    significanceHi: 'माँ गंगा का धरती पर अवतरण — स्नान-दान का महापर्व',
    emoji: '🌊',
    kind: 'festival',
    tier: 'major',
  },
  {
    id: 'gayatri-jayanti-2026',
    date: '2026-06-12',
    nameEn: 'Gayatri Jayanti',
    nameHi: 'गायत्री जयंती',
    significanceHi: 'वेदमाता गायत्री का प्रकटोत्सव',
    emoji: '📿',
    kind: 'jayanti',
    tier: 'observance',
  },
  {
    id: 'nirjala-ekadashi-2026',
    date: '2026-06-13',
    nameEn: 'Nirjala Ekadashi',
    nameHi: 'निर्जला एकादशी',
    significanceHi: 'बिना जल का सबसे कठिन एकादशी व्रत — सालभर की एकादशियों का फल',
    emoji: '💧',
    kind: 'ekadashi',
    tier: 'major',
  },
  {
    id: 'vat-purnima-2026',
    date: '2026-06-16',
    nameEn: 'Vat Purnima Vrat',
    nameHi: 'वट पूर्णिमा व्रत',
    significanceHi: 'महाराष्ट्र-गुजरात में मनाया जाने वाला वट वृक्ष व्रत',
    emoji: '🌳',
    kind: 'purnima',
    tier: 'observance',
  },
  {
    id: 'yogini-ekadashi-2026',
    date: '2026-06-23',
    nameEn: 'Yogini Ekadashi',
    nameHi: 'योगिनी एकादशी',
    significanceHi: 'पापों से मुक्ति देने वाली एकादशी',
    emoji: '🪔',
    kind: 'ekadashi',
    tier: 'major',
  },
];

const MS_PER_DAY = 86_400_000;

/** Local-midnight aware day diff. Positive = future, 0 = today, negative = past. */
export function daysUntil(dateStr: string, now: Date = new Date()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Returns festivals from today through `withinDays` ahead, sorted by date.
 * "Today" festivals come first; same-day ties keep major tier ahead of observance.
 */
export function getUpcomingFestivals(
  now: Date = new Date(),
  withinDays = 45,
): Festival[] {
  return FESTIVALS_2026
    .map(f => ({ f, d: daysUntil(f.date, now) }))
    .filter(({ d }) => d >= 0 && d <= withinDays)
    .sort((a, b) => {
      if (a.d !== b.d) return a.d - b.d;
      const tierRank = (t: FestivalTier) => (t === 'major' ? 0 : 1);
      return tierRank(a.f.tier) - tierRank(b.f.tier);
    })
    .map(({ f }) => f);
}

/** Short relative label in Hindi — "आज", "कल", "5 दिन में". */
export function relativeLabelHi(dateStr: string, now: Date = new Date()): string {
  const d = daysUntil(dateStr, now);
  if (d === 0) return 'आज';
  if (d === 1) return 'कल';
  return `${d} दिन में`;
}
