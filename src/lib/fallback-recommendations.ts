import type { Track } from '@/types';

/**
 * Fallback recommendation queries when AI is unavailable
 * These are curated search terms that work well with YouTube Music
 */
const FALLBACK_QUERIES = {
    // Time-based
    morning: [
        'Good morning songs',
        'Morning motivation music',
        'Positive vibes morning playlist',
        'Sunrise chill music'
    ],
    afternoon: [
        'Afternoon chill vibes',
        'Lunch break relaxation',
        'Midday energy boost',
        'Feel good afternoon songs'
    ],
    evening: [
        'Evening relaxation music',
        'Sunset chill playlist',
        'Wind down evening songs',
        'Peaceful evening vibes'
    ],
    night: [
        'Late night chill',
        'Midnight vibes',
        'Night drive music',
        'Calm night playlist'
    ],
    
    // Mood-based
    happy: [
        'Happy upbeat songs',
        'Feel good music playlist',
        'Positive energy songs',
        'Joyful pop hits'
    ],
    sad: [
        'Sad emotional songs',
        'Heartbreak ballads',
        'Melancholy acoustic',
        'Emotional piano music'
    ],
    energetic: [
        'Workout motivation music',
        'High energy EDM',
        'Gym beast mode playlist',
        'Running pump up songs'
    ],
    relaxed: [
        'Chill lofi beats',
        'Relaxing acoustic guitar',
        'Spa meditation music',
        'Nature sounds relaxation'
    ],
    
    // Genre-based (Indian focus for MelodyMixx India)
    bollywood: [
        'Latest Bollywood hits 2026',
        'Bollywood romantic songs',
        'Bollywood dance numbers',
        'Arijit Singh best songs'
    ],
    punjabi: [
        'Punjabi top hits 2026',
        'Diljit Dosanjh latest songs',
        'AP Dhillon new tracks',
        'Punjabi party anthems'
    ],
    tamil: [
        'Tamil latest hits',
        'Anirudh Ravichander songs',
        'AR Rahman melodies',
        'Kollywood chartbusters'
    ],
    telugu: [
        'Telugu top songs 2026',
        'SS Thaman hits',
        'Devi Sri Prasad mass songs',
        'Tollywood melodies'
    ],
    indie: [
        'Indian indie pop',
        'Prateek Kuhad style artists',
        'When Chai Met Toast vibes',
        'Indian folk fusion'
    ],
    
    // Activity-based
    workout: [
        'Gym workout motivation',
        'Cardio running playlist',
        'Weightlifting power music',
        'Crossfit beast mode'
    ],
    study: [
        'Focus study concentration',
        'Deep work ambient',
        'Reading classical music',
        'Brain food instrumental'
    ],
    party: [
        'Party dance hits',
        'Club bangers 2026',
        'House party playlist',
        'DJ remix popular'
    ],
    travel: [
        'Road trip songs',
        'Travel adventure music',
        'Long drive playlist',
        'Journey soundtrack'
    ]
};

/**
 * Get fallback recommendations based on context
 */
export function getFallbackRecommendations(
    options: {
        mood?: string;
        timeOfDay?: string;
        genre?: string;
        activity?: string;
        limit?: number;
    } = {}
): string[] {
    const { mood, timeOfDay, genre, activity, limit = 8 } = options;
    const queries: string[] = [];
    
    // Priority order: genre > activity > mood > time
    
    if (genre && genre in FALLBACK_QUERIES) {
        queries.push(...FALLBACK_QUERIES[genre as keyof typeof FALLBACK_QUERIES]);
    }
    
    if (activity && activity in FALLBACK_QUERIES) {
        queries.push(...FALLBACK_QUERIES[activity as keyof typeof FALLBACK_QUERIES]);
    }
    
    if (mood && mood.toLowerCase() in FALLBACK_QUERIES) {
        queries.push(...FALLBACK_QUERIES[mood.toLowerCase() as keyof typeof FALLBACK_QUERIES]);
    }
    
    if (timeOfDay && timeOfDay.toLowerCase() in FALLBACK_QUERIES) {
        queries.push(...FALLBACK_QUERIES[timeOfDay.toLowerCase() as keyof typeof FALLBACK_QUERIES]);
    }
    
    // If nothing matched, use generic fallbacks
    if (queries.length === 0) {
        queries.push(
            'Top trending songs India 2026',
            'Popular music right now',
            'Viral hits playlist',
            'Best new music 2026'
        );
    }
    
    // Shuffle and return limited set
    return shuffleArray(queries).slice(0, limit);
}

/**
 * Get emergency fallback for any failed search
 */
export function getEmergencyFallback(): string[] {
    return [
        'Top 50 India',
        'Viral songs playlist',
        'Trending music 2026',
        'Popular hits right now',
        'Best of 2026 music'
    ];
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate smart fallback based on current track
 */
export function getTrackBasedFallback(currentTrack: Track, limit: number = 5): string[] {
    const artist = currentTrack.artist || '';
    const title = currentTrack.title || '';
    
    const queries: string[] = [];
    
    // Same artist
    if (artist) {
        queries.push(`${artist} top songs`, `${artist} latest hits`, `${artist} best tracks`);
    }
    
    // Similar vibe (generic)
    queries.push(
        'Similar vibes playlist',
        'Music like this',
        'If you like this song'
    );
    
    // Genre guess based on keywords
    if (title.toLowerCase().includes('love') || title.toLowerCase().includes('heart')) {
        queries.push('Romantic songs playlist', 'Love songs 2026');
    } else if (title.toLowerCase().includes('party') || title.toLowerCase().includes('dance')) {
        queries.push('Party hits 2026', 'Dance floor bangers');
    } else if (title.toLowerCase().includes('chill') || title.toLowerCase().includes('relax')) {
        queries.push('Chill out music', 'Relaxation playlist');
    }
    
    return shuffleArray(queries).slice(0, limit);
}
