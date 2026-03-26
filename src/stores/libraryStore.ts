import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type { Track } from '@/types';

interface LikedSong {
    song_id: string;
    title: string;
    artist: string;
    thumbnail: string;
    liked_at: number;
}

interface LibraryState {
    likedSongs: LikedSong[];
    likedSongIds: Set<string>;
    isLoading: boolean;
}

interface LibraryActions {
    fetchLikedSongs: () => Promise<void>;
    toggleLike: (track: Track) => Promise<void>;
    isLiked: (songId: string) => boolean;
    trackListeningHistory: (track: Track, duration: number, completed: boolean, skipped: boolean) => Promise<void>;
}

const initialState: LibraryState = {
    likedSongs: [],
    likedSongIds: new Set(),
    isLoading: false,
};

export const useLibraryStore = create<LibraryState & LibraryActions>()((set, get) => ({
    ...initialState,

    fetchLikedSongs: async () => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        set({ isLoading: true });

        try {
            // Supabase backend is disabled.
            const likedSongs: LikedSong[] = [];
            const songIds: string[] = [];
            const likedSongIds = new Set<string>(songIds);

            set({ likedSongs, likedSongIds, isLoading: false });
        } catch (error) {
            console.error('Error fetching liked songs:', error);
            set({ isLoading: false });
        }
    },

    toggleLike: async (track: Track) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) {
            console.warn('User not authenticated');
            return;
        }

        const { likedSongIds, likedSongs } = get();
        const isCurrentlyLiked = likedSongIds.has(track.id);

        // OPTIMISTIC UPDATE: Update local state immediately
        if (isCurrentlyLiked) {
            const newLikedSongs = likedSongs.filter(s => s.song_id !== track.id);
            const newLikedSongIds = new Set(likedSongIds);
            newLikedSongIds.delete(track.id);
            set({ likedSongs: newLikedSongs, likedSongIds: newLikedSongIds });
            console.log(`[Library] Unliked (Optimistic): ${track.title}`);
        } else {
            const liked_at = Math.floor(Date.now() / 1000);
            const newLikedSong: LikedSong = {
                song_id: track.id,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                liked_at,
            };
            const newLikedSongs = [newLikedSong, ...likedSongs];
            const newLikedSongIds = new Set(likedSongIds);
            newLikedSongIds.add(track.id);
            set({ likedSongs: newLikedSongs, likedSongIds: newLikedSongIds });
            console.log(`[Library] Liked (Optimistic): ${track.title}`);
        }

        try {
            // Supabase backend is disabled, so we skip syncing.
        } catch (error) {
            console.error('Error toggling like (Reverting):', error);
            // Revert state on error
            set({ likedSongs, likedSongIds });
        }
    },

    isLiked: (songId: string) => {
        return get().likedSongIds.has(songId);
    },

    trackListeningHistory: async (track: Track, duration: number, completed: boolean, skipped: boolean) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        try {
            // Supabase backend is disabled, returning directly
        } catch (error) {
            console.error('Error tracking listening history:', error);
        }
    },
}));
