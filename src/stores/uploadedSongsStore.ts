import { create } from 'zustand';
import { db, type LocalSong } from '@/lib/dexie';
import { useAuthStore } from './authStore';
import { toast } from '@/hooks/useToast';
import type { Track } from '@/types';

export interface UploadedSong {
    id: string; // We'll convert LocalSong.id (number) to string for consistency
    title: string;
    artist: string;
    genre: string;
    fileName: string;
    storageUrl: string; // We'll use this for the blob: URL
    storagePath: string; // Unused in local context but kept for interface compatibility
    thumbnail: string;
    duration: number;
    uploadedAt: any;
    userId: string;
    blob?: Blob; // Keeping reference to original blob
}

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'done' | 'error';
}

interface UploadedSongsState {
    songs: UploadedSong[];
    isLoading: boolean;
    uploads: UploadProgress[];
}

interface UploadedSongsActions {
    fetchSongs: () => Promise<void>;
    uploadSong: (file: File, metadata: { title: string; artist: string; genre: string }) => Promise<void>;
    deleteSong: (song: UploadedSong) => Promise<void>;
    toTrack: (song: UploadedSong) => Track;
    getAllAsTracks: () => Track[];
}

const initialState: UploadedSongsState = {
    songs: [],
    isLoading: false,
    uploads: [],
};

// Revoke existing blob URLs when new ones are created to avoid memory leaks
const revokeExistingUrls = (songs: UploadedSong[]) => {
    songs.forEach(song => {
        if (song.storageUrl && song.storageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(song.storageUrl);
        }
    });
};

export const useUploadedSongsStore = create<UploadedSongsState & UploadedSongsActions>()(
    (set, get) => ({
        ...initialState,

        fetchSongs: async () => {
            set({ isLoading: true });

            try {
                // Fetch from Dexie, ordered by uploadedAt desc
                const localSongs = await db.songs.orderBy('uploadedAt').reverse().toArray();
                
                // Clean up old blob URLs
                revokeExistingUrls(get().songs);

                // Convert to UploadedSong interface and create blob URLs
                const songs: UploadedSong[] = localSongs.map((local) => {
                    const blobUrl = URL.createObjectURL(local.blob);
                    return {
                        id: String(local.id),
                        title: local.title,
                        artist: local.artist,
                        genre: local.genre,
                        fileName: local.fileName,
                        storageUrl: blobUrl, // Use blob URL as the playback source
                        storagePath: `local/${local.id}`,
                        thumbnail: '', // Could extract ID3 tags in the future
                        duration: local.duration,
                        uploadedAt: new Date(local.uploadedAt),
                        userId: local.userId,
                        blob: local.blob
                    };
                });

                set({ songs, isLoading: false });
            } catch (error) {
                console.error('[UploadedSongs] Fetch error:', error);
                set({ isLoading: false });
            }
        },

        uploadSong: async (file, metadata) => {
            const userId = useAuthStore.getState().userId || 'local-user'; // Fallback if offline/not signed in
            const fileName = file.name;

            // Add to upload progress
            set((state) => ({
                uploads: [
                    ...state.uploads,
                    { fileName, progress: 0, status: 'uploading' as const },
                ],
            }));

            try {
                // Get audio duration
                const duration = await getAudioDuration(file);

                // Progress simulation since local save is practically instant
                set((state) => ({
                    uploads: state.uploads.map((u) =>
                        u.fileName === fileName ? { ...u, progress: 50 } : u
                    ),
                }));

                // Save to Dexie LocalBrowserStorage
                const localSong: LocalSong = {
                    title: metadata.title,
                    artist: metadata.artist,
                    genre: metadata.genre,
                    fileName,
                    duration,
                    uploadedAt: Date.now(),
                    userId,
                    blob: file, // Store the raw File/Blob
                };

                const dbId = await db.songs.add(localSong);

                // Create a temporary Blob URL for immediate playback
                const blobUrl = URL.createObjectURL(file);

                // Add to local Zustand state
                const newSong: UploadedSong = {
                    id: String(dbId),
                    title: metadata.title,
                    artist: metadata.artist,
                    genre: metadata.genre,
                    fileName,
                    storageUrl: blobUrl,
                    storagePath: `local/${dbId}`,
                    thumbnail: '', // Add local thumbnail extraction later if needed
                    duration,
                    uploadedAt: new Date(localSong.uploadedAt),
                    userId,
                    blob: file
                };

                set((state) => ({
                    songs: [newSong, ...state.songs],
                    uploads: state.uploads.map((u) =>
                        u.fileName === fileName
                            ? { ...u, progress: 100, status: 'done' as const }
                            : u
                    ),
                }));

                toast(`🎵 "${metadata.title}" uploaded successfully!`, 'success');

                // Clear completed upload UI after 2s
                setTimeout(() => {
                    set((state) => ({
                        uploads: state.uploads.filter((u) => u.fileName !== fileName),
                    }));
                }, 2000);

            } catch (error) {
                console.error('[UploadedSongs] Upload error:', error);
                
                set((state) => ({
                    uploads: state.uploads.map((u) =>
                        u.fileName === fileName
                            ? { ...u, status: 'error' as const }
                            : u
                    ),
                }));
                
                toast(`Failed to save "${fileName}" locally`, 'error');
            }
        },

        deleteSong: async (song) => {
            try {
                // Delete from IndexedDB SQLite
                await db.songs.delete(Number(song.id));

                // Revoke the blob URL memory
                if (song.storageUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(song.storageUrl);
                }

                // Remove from local Zustand state
                set((state) => ({
                    songs: state.songs.filter((s) => s.id !== song.id),
                }));

                toast(`"${song.title}" deleted`, 'info');
            } catch (error) {
                console.error('[UploadedSongs] Delete error:', error);
                toast('Failed to delete song', 'error');
            }
        },

        toTrack: (song) => ({
            id: `local_${song.id}`, // Prefixing for the general Player queue logic
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail || '/placeholder-album.png',
            duration: song.duration,
            videoId: song.storageUrl, // The Player component will handle blob: URLs natively
        }),

        getAllAsTracks: () => {
            return get().songs.map((s) => get().toTrack(s));
        },
    })
);

// Helper: extract audio duration from File/Blob
function getAudioDuration(file: File | Blob): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            resolve(Math.round(audio.duration));
            URL.revokeObjectURL(audio.src);
        };
        audio.onerror = () => resolve(0); // Proceed anyway if duration cannot be extracted
        audio.src = URL.createObjectURL(file);
    });
}
