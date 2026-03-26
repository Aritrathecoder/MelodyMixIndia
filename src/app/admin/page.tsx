'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useUploadedSongsStore } from '@/stores/uploadedSongsStore';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Music2, X, FileAudio, Trash2, Play, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';

interface PendingFile {
    file: File;
    title: string;
    artist: string;
    genre: string;
}

export default function AdminPage() {
    const { user, isAdmin } = useAuthStore();
    const { songs, uploads, uploadSong, deleteSong, fetchSongs, getAllAsTracks } = useUploadedSongsStore();
    const { setQueue } = useQueueStore();
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch songs on mount
    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    const handleFiles = useCallback((files: FileList | File[]) => {
        const mp3Files = Array.from(files).filter(
            (f) => f.type === 'audio/mpeg' || f.name.endsWith('.mp3') || f.type === 'audio/mp4' || f.name.endsWith('.m4a')
        );

        const newPending: PendingFile[] = mp3Files.map((file) => {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const parts = nameWithoutExt.split(' - ');
            return {
                file,
                title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : nameWithoutExt,
                artist: parts.length > 1 ? parts[0].trim() : 'Unknown Artist',
                genre: 'General',
            };
        });

        setPendingFiles((prev) => [...prev, ...newPending]);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const removePending = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const updatePending = (index: number, field: keyof PendingFile, value: string) => {
        setPendingFiles((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const uploadAll = async () => {
        for (const pending of pendingFiles) {
            await uploadSong(pending.file, {
                title: pending.title,
                artist: pending.artist,
                genre: pending.genre,
            });
        }
        setPendingFiles([]);
    };

    const playAllUploaded = () => {
        const tracks = getAllAsTracks();
        if (tracks.length > 0) setQueue(tracks, 0);
    };

    // --- Admin Gate ---
    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Admin Access Only</h2>
                    <p className="text-white/50 max-w-sm">
                        This panel is restricted to administrators. Only the admin can upload and manage songs.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
                            Admin Panel
                        </h1>
                    </div>
                    <p className="text-gray-400">
                        Upload and manage songs for all MelodyMix users
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                        isDragOver
                            ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                        multiple
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                        className="hidden"
                    />
                    <div className="space-y-4">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${isDragOver ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                            <Upload className={`w-8 h-8 ${isDragOver ? 'text-purple-400' : 'text-white/40'}`} />
                        </div>
                        <div>
                            <p className="text-lg font-medium">
                                {isDragOver ? 'Drop your files here!' : 'Drop MP3 files here'}
                            </p>
                            <p className="text-sm text-white/40 mt-1">
                                or click to browse • Supports MP3 & M4A
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pending Files (Edit before upload) */}
                {pendingFiles.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                Ready to Upload ({pendingFiles.length})
                            </h2>
                            <Button
                                onClick={uploadAll}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload All
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {pendingFiles.map((pending, index) => (
                                <div
                                    key={index}
                                    className="bg-zinc-900/70 border border-white/5 rounded-xl p-4 flex items-start gap-4"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <FileAudio className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Title</label>
                                            <input
                                                value={pending.title}
                                                onChange={(e) => updatePending(index, 'title', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Artist</label>
                                            <input
                                                value={pending.artist}
                                                onChange={(e) => updatePending(index, 'artist', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Genre</label>
                                            <select
                                                value={pending.genre}
                                                onChange={(e) => updatePending(index, 'genre', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition"
                                            >
                                                <option value="General">General</option>
                                                <option value="Bollywood">Bollywood</option>
                                                <option value="Pop">Pop</option>
                                                <option value="Rock">Rock</option>
                                                <option value="Hip-Hop">Hip-Hop</option>
                                                <option value="Electronic">Electronic</option>
                                                <option value="Classical">Classical</option>
                                                <option value="Lo-Fi">Lo-Fi</option>
                                                <option value="Punjabi">Punjabi</option>
                                                <option value="Tamil">Tamil</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removePending(index)}
                                        className="text-white/30 hover:text-red-400 transition mt-2"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Uploads (Progress) */}
                {uploads.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-white/70">Uploading...</h2>
                        {uploads.map((u) => (
                            <div
                                key={u.fileName}
                                className="bg-zinc-900/70 border border-white/5 rounded-xl p-4 space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="truncate">{u.fileName}</span>
                                    <span className={u.status === 'done' ? 'text-emerald-400' : u.status === 'error' ? 'text-red-400' : 'text-purple-400'}>
                                        {u.status === 'done' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : u.status === 'error' ? (
                                            'Failed'
                                        ) : (
                                            `${u.progress}%`
                                        )}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            u.status === 'done'
                                                ? 'bg-emerald-400'
                                                : u.status === 'error'
                                                ? 'bg-red-400'
                                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                        }`}
                                        style={{ width: `${u.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Uploaded Songs Library */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            Your Library ({songs.length})
                        </h2>
                        {songs.length > 0 && (
                            <Button
                                onClick={playAllUploaded}
                                className="bg-white text-black hover:bg-white/90 font-semibold"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Play All
                            </Button>
                        )}
                    </div>

                    {songs.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-white/5">
                            <Music2 className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 text-lg">No songs uploaded yet</p>
                            <p className="text-white/20 text-sm mt-1">
                                Drop some MP3 files above to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {songs.map((song, index) => (
                                <div
                                    key={song.id}
                                    className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 transition cursor-pointer border border-transparent hover:border-white/5"
                                    onClick={() => {
                                        const tracks = getAllAsTracks();
                                        setQueue(tracks, index);
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                                        <Music2 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{song.title}</div>
                                        <div className="text-sm text-white/40 truncate">
                                            {song.artist} {song.genre !== 'General' ? `• ${song.genre}` : ''}
                                        </div>
                                    </div>
                                    <div className="text-xs text-white/20">
                                        {song.duration > 0
                                            ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}`
                                            : '--:--'}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete "${song.title}"?`)) {
                                                deleteSong(song);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
