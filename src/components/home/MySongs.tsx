'use client';

import { useEffect } from 'react';
import { Music2, Play, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadedSongsStore } from '@/stores/uploadedSongsStore';
import { useQueueStore } from '@/stores/queueStore';
import Link from 'next/link';

export function MySongs() {
    const { songs, fetchSongs, getAllAsTracks, isLoading } = useUploadedSongsStore();
    const { setQueue } = useQueueStore();

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    // Don't show the section if no songs
    if (songs.length === 0 && !isLoading) return null;

    const handlePlayAll = () => {
        const tracks = getAllAsTracks();
        if (tracks.length > 0) setQueue(tracks, 0);
    };

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-pink-400" />
                    <h2 className="text-2xl font-bold tracking-tight">My Uploaded Songs</h2>
                    <span className="text-sm text-white/40 ml-2">({songs.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    {songs.length > 0 && (
                        <Button
                            onClick={handlePlayAll}
                            size="sm"
                            className="bg-white text-black hover:bg-white/90 font-semibold"
                        >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            Play All
                        </Button>
                    )}
                    <Link href="/upload">
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-white">
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                            <div className="h-4 rounded bg-white/5 w-3/4 animate-pulse" />
                            <div className="h-3 rounded bg-white/5 w-1/2 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {songs.slice(0, 10).map((song, index) => (
                        <div
                            key={song.id}
                            onClick={() => {
                                const tracks = getAllAsTracks();
                                setQueue(tracks, index);
                            }}
                            className="group cursor-pointer space-y-3"
                        >
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-500/20 flex items-center justify-center relative overflow-hidden border border-white/5 group-hover:border-white/10 transition">
                                <Music2 className="w-10 h-10 text-white/20" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                    <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition" />
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-sm truncate">{song.title}</div>
                                <div className="text-xs text-white/40 truncate">{song.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
