import type { TrendsResponse } from './types';

/**
 * Fallback used ONLY when:
 *   (a) ANTHROPIC_API_KEY is missing, AND
 *   (b) the reviewer still wants to see the UI render
 *
 * This is a safety net so the prototype doesn't 500 on first load.
 * In any real invocation with a valid key, the live pipeline runs.
 */
export const FALLBACK_TRENDS: TrendsResponse = {
  generatedAt: new Date().toISOString(),
  count: 12,
  cacheHit: false,
  nextRefreshAt: new Date(Date.now() + 600_000).toISOString(),
  trends: [
    {
      id: 'mock_1', rank: 1, slug: 'india-vs-australia',
      hashtagHi: '#भारतबनामऑस्ट्रेलिया', hashtagEn: '#IndiaVsAustralia',
      descriptionHi: 'भारत और ऑस्ट्रेलिया के बीच रोमांचक मैच', descriptionEn: 'India vs Australia — tense finish in progress',
      category: 'cricket', heat: 96, sources: ['google_trends', 'news_rss', 'reddit_india'],
      approxPosts: 128000,
    },
    {
      id: 'mock_2', rank: 2, slug: 'diwali-2026',
      hashtagHi: '#दिवाली2026', hashtagEn: '#Diwali2026',
      descriptionHi: 'दिवाली पर देशभर में रौनक, लोग दे रहे शुभकामनाएं', descriptionEn: 'Diwali buzz — greetings and rangoli posts rising fast',
      category: 'festival', heat: 92, sources: ['google_trends', 'news_rss'],
      approxPosts: 84000,
    },
    {
      id: 'mock_3', rank: 3, slug: 'rbi-rate-cut',
      hashtagHi: '#RBIरेपोरेट', hashtagEn: '#RBIRepoRateCut',
      descriptionHi: 'आरबीआई ने रेपो रेट में की कटौती, EMI पर क्या असर', descriptionEn: 'RBI cuts repo rate — home loans get cheaper',
      category: 'business', heat: 84, sources: ['news_rss', 'google_trends'],
      approxPosts: 34000,
    },
    {
      id: 'mock_4', rank: 4, slug: 'mumbai-rains',
      hashtagHi: '#मुंबईबारिश', hashtagEn: '#MumbaiRains',
      descriptionHi: 'मुंबई में भारी बारिश, कई इलाकों में जलभराव', descriptionEn: 'Heavy rain hits Mumbai, waterlogging in multiple areas',
      category: 'regional_news', heat: 82, sources: ['google_trends', 'news_rss', 'reddit_india'],
      approxPosts: 51000,
    },
    {
      id: 'mock_5', rank: 5, slug: 'stranger-things',
      hashtagHi: '#StrangerThings5', hashtagEn: '#StrangerThings5',
      descriptionHi: 'नेटफ्लिक्स की हिट सीरीज़ का नया सीज़न रिलीज़', descriptionEn: 'Stranger Things Season 5 drops today',
      category: 'entertainment', heat: 78, sources: ['google_trends', 'reddit_india'],
      approxPosts: 42000,
    },
    {
      id: 'mock_6', rank: 6, slug: 'karwa-chauth',
      hashtagHi: '#करवाचौथ', hashtagEn: '#KarwaChauth',
      descriptionHi: 'करवा चौथ पर चांद देखने की परंपरा, शुभ मुहूर्त', descriptionEn: 'Karwa Chauth moonrise timings trending across north India',
      category: 'devotional', heat: 74, sources: ['google_trends'],
      approxPosts: 67000,
    },
    {
      id: 'mock_7', rank: 7, slug: 'shahrukh-birthday',
      hashtagHi: '#शाहरुखखान', hashtagEn: '#ShahRukhKhan',
      descriptionHi: 'किंग खान के जन्मदिन पर फैन्स का प्यार बरसा', descriptionEn: 'SRK birthday — fans flood social with tributes',
      category: 'entertainment', heat: 71, sources: ['google_trends', 'news_rss'],
      approxPosts: 38000,
    },
    {
      id: 'mock_8', rank: 8, slug: 'budget-2026',
      hashtagHi: '#बजट2026', hashtagEn: '#Budget2026',
      descriptionHi: 'वित्त मंत्री ने किया बजट पेश, टैक्स में बदलाव', descriptionEn: 'Union Budget — new tax slabs announced',
      category: 'politics', heat: 69, sources: ['news_rss'],
      approxPosts: 29000,
    },
    {
      id: 'mock_9', rank: 9, slug: 'isro-mission',
      hashtagHi: '#ISRO', hashtagEn: '#ISROMission',
      descriptionHi: 'इसरो ने किया नया मिशन लॉन्च, देश गर्व से भरा', descriptionEn: 'ISRO launches new mission — country celebrates',
      category: 'tech', heat: 66, sources: ['news_rss', 'reddit_india'],
      approxPosts: 22000,
    },
    {
      id: 'mock_10', rank: 10, slug: 'kabaddi-finals',
      hashtagHi: '#प्रोकबड्डी', hashtagEn: '#ProKabaddi',
      descriptionHi: 'प्रो कबड्डी फाइनल आज रात, चैम्पियन कौन बनेगा', descriptionEn: 'Pro Kabaddi finals tonight — who lifts the trophy',
      category: 'sports_other', heat: 62, sources: ['news_rss'],
      approxPosts: 14000,
    },
    {
      id: 'mock_11', rank: 11, slug: 'viral-meme',
      hashtagHi: '#वायरलवीडियो', hashtagEn: '#ViralVideo',
      descriptionHi: 'एक वायरल वीडियो पर पूरा इंटरनेट हंस रहा है', descriptionEn: 'Random viral video has all of Indian Twitter laughing',
      category: 'viral', heat: 58, sources: ['reddit_india'],
      approxPosts: 18000,
    },
    {
      id: 'mock_12', rank: 12, slug: 'up-news',
      hashtagHi: '#लखनऊ', hashtagEn: '#Lucknow',
      descriptionHi: 'लखनऊ में बड़ी खबर, जानिए पूरा मामला', descriptionEn: 'Major incident in Lucknow — local news trending',
      category: 'regional_news', heat: 54, sources: ['news_rss'],
      approxPosts: 9000,
    },
  ],
};
