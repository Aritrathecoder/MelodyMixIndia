import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type { Track } from '@/types';

interface Playlist {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    created_at: number;
    updated_at: number;
}

interface PlaylistSong {
    song_id: string;
    title: string;
    artist: string;
    thumbnail: string | null;
    position: number;
    added_at: number;
}

interface PlaylistsState {
    playlists: Playlist[];
    currentPlaylistSongs: PlaylistSong[];
    isLoading: boolean;
}

interface PlaylistsActions {
    fetchPlaylists: () => Promise<void>;
    createPlaylist: (name: string, description?: string) => Promise<string | null>;
    deletePlaylist: (playlistId: string) => Promise<void>;
    fetchPlaylistSongs: (playlistId: string) => Promise<void>;
    addSongToPlaylist: (playlistId: string, track: Track) => Promise<void>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
}

const initialState: PlaylistsState = {
    playlists: [],
    currentPlaylistSongs: [],
    isLoading: false,
};

export const usePlaylistsStore = create<PlaylistsState & PlaylistsActions>()((set, get) => ({
    ...initialState,

    fetchPlaylists: async () => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        set({ isLoading: true });

        try {
            // Supabase backend is disabled.
            set({ playlists: [], isLoading: false });
        } catch (error) {
            console.error('Error fetching playlists:', error);
            set({ isLoading: false });
        }
    },

    createPlaylist: async (name: string, description?: string) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return null;

        try {
            const now = Math.floor(Date.now() / 1000);
            const mockId = `mock-playlist-${now}`;
            const newPlaylist = {
                id: mockId,
                user_id: userId,
                name,
                description: description || null,
                thumbnail: null,
                created_at: now,
                updated_at: now,
            };

            // Add to local state
            set({ playlists: [newPlaylist, ...get().playlists] });
            console.log(`[Playlists] Created playlist: ${name} (Mock)`);

            return mockId;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    },

    deletePlaylist: async (playlistId: string) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        try {
            // Supabase backend is disabled. We just remove from local state.
            set({ playlists: get().playlists.filter(p => p.id !== playlistId) });
            console.log(`[Playlists] Deleted playlist: ${playlistId} (Mock)`);
        } catch (error) {
            console.error('Error deleting playlist:', error);
        }
    },

    fetchPlaylistSongs: async (playlistId: string) => {
        set({ isLoading: true });

        try {
            // Skip database query for YouTube Music playlists/albums
            // They start with RDCLAK, OLAK, or MPREb and aren't in our database
            // 1. Check for known YouTube Music ID prefixes
            const isKnownYouTubeId = playlistId.startsWith('RDCLAK') ||
                playlistId.startsWith('OLAK') ||
                playlistId.startsWith('MPREb');

            // 2. Check if it's a valid UUID (database ID)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playlistId);

            // If it's a known YT ID *OR* simply NOT a UUID, treat as external/skip DB
            if (isKnownYouTubeId || !isUUID || true) { // Always skip DB since Supabase is disabled
                console.log(`[Playlists] Skipping database query for External/YouTube ID or Mock: ${playlistId}`);
                set({ currentPlaylistSongs: [], isLoading: false });
                return;
            }
        } catch (error) {
            console.error('Error fetching playlist songs:', error);
            set({ isLoading: false });
        }
    },

    addSongToPlaylist: async (playlistId: string, track: Track) => {
        try {
            // Supabase backend is disabled.
            console.log(`[Playlists] Added song ${track.title} to playlist (Mock)`);
        } catch (error) {
            console.error('Error adding song to playlist:', error);
        }
    },

    removeSongFromPlaylist: async (playlistId: string, songId: string) => {
        try {
            // Supabase backend disabled. Update local state
            set({
                currentPlaylistSongs: get().currentPlaylistSongs.filter(
                    s => s.song_id !== songId
                ),
            });

            console.log(`[Playlists] Removed song from playlist (Mock)`);
        } catch (error) {
            console.error('Error removing song from playlist:', error);
        }
    },
}));
