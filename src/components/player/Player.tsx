'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useQueueStore } from '@/stores/queueStore';
import { useAutoQueue } from '@/hooks/useAutoQueue';
import type { Track } from '@/types';

// YouTube IFrame API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if (ytApiLoaded && window.YT?.Player) {
            resolve();
            return;
        }

        ytApiCallbacks.push(resolve);

        if (ytApiLoading) return;
        ytApiLoading = true;

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            ytApiCallbacks.forEach((cb) => cb());
            ytApiCallbacks.length = 0;
        };
    });
}

export function Player() {
    const playerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentVideoIdRef = useRef<string | null>(null);
    const playerReadyRef = useRef(false);
    const isLocalTrackRef = useRef(false);

    // History tracking refs
    const playStartTimeRef = useRef<number>(0);
    const currentTrackRef = useRef<Track | null>(null);

    const {
        isPlaying,
        volume,
        isMuted,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setLoading,
        hdMode,
    } = usePlayerStore();

    const { playNext, repeatMode, trimOldTracks, autoLoadSongs } = useQueueStore();

    // Enable smart auto-queue
    const { checkAndLoad } = useAutoQueue();

    // -------------------------------------------------------------------------
    // ALGORITHMIC HD AUDIO ENGINE
    // -------------------------------------------------------------------------
    // Forces the highest possible audio bitrate by requesting max video quality.
    // YouTube ties audio quality to video resolution (1080p+ = ~192kbps AAC/Opus)
    const enforceHdAudio = useCallback(() => {
        if (!playerRef.current || !playerReadyRef.current) return;

        if (hdMode) {
            console.log('[HD Engine] Enforcing High Definition Audio...');
            try {
                // Try aggressive quality enforcement
                playerRef.current.setPlaybackQuality('hd1080');
                playerRef.current.setPlaybackQuality('highres');

                // Double-check quality after small delay to Ensure it sticks
                setTimeout(() => {
                    if (playerRef.current?.getPlaybackQuality) {
                        const q = playerRef.current.getPlaybackQuality();
                        console.log('[HD Engine] Current Quality:', q);
                        if (q !== 'hd1080' && q !== 'highres') {
                            playerRef.current.setPlaybackQuality('hd1080');
                        }
                    }
                }, 1000);
            } catch (e) {
                console.warn('[HD Engine] Failed to set quality:', e);
            }
        }
    }, [hdMode]);

    // Re-run enforcement when HD mode changes
    useEffect(() => {
        if (hdMode) {
            enforceHdAudio();
        }
    }, [hdMode, enforceHdAudio]);

    // Save play to history (when track starts)
    const savePlayToHistory = useCallback(async (track: Track) => {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    track: {
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        thumbnail: track.thumbnail,
                        duration: track.duration,
                    },
                    completionRate: 0,
                    skipped: false,
                }),
            });
            console.log('[History] Saved play:', track.title);
        } catch (error) {
            console.error('[History] Failed to save:', error);
        }
    }, []);

    // Start progress tracking interval
    const startProgressTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            if (playerRef.current?.getCurrentTime && playerReadyRef.current) {
                try {
                    const time = playerRef.current.getCurrentTime();
                    if (typeof time === 'number' && !isNaN(time)) {
                        setCurrentTime(time);
                    }
                } catch {
                    // Player might be in transition
                }
            }
        }, 250);
    }, [setCurrentTime]);

    // Load a video by ID - the key function for instant track changes
    const loadVideo = useCallback((videoId: string) => {
        console.log('[Player] Loading media:', videoId);
        currentVideoIdRef.current = videoId;
        playStartTimeRef.current = 0; // Reset play tracking
        setLoading(true);
        setCurrentTime(0);

        const isLocal = videoId.startsWith('blob:') || videoId.startsWith('http://localhost') || videoId.includes('supabase') || videoId.includes('firebase');
        isLocalTrackRef.current = isLocal;

        if (isLocal) {
            // Stop YouTube player if playing
            if (playerRef.current?.pauseVideo) {
                try { playerRef.current.pauseVideo(); } catch (e) {}
            }
            
            // Play using HTML5 Audio
            if (audioRef.current) {
                audioRef.current.src = videoId;
                audioRef.current.load();
                audioRef.current.play().catch(e => {
                    console.warn('[Player] Autoplay blocked by browser:', e);
                    setIsPlaying(false);
                    setLoading(false);
                });
            }
        } else {
            // YouTube Track
            if (!playerRef.current || !playerReadyRef.current) return;
            
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src'); // Stop downloading previous blob
            }

            try {
                // Use loadVideoById for instant switching without recreating player
                playerRef.current.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0,
                });
            } catch (error) {
                console.error('[Player] loadVideoById error:', error);
                setLoading(false);
            }
        }
    }, [setLoading, setCurrentTime]);

    // Initialize player once on mount
    useEffect(() => {
        const initPlayer = async () => {
            await loadYouTubeAPI();

            if (!containerRef.current || playerRef.current) return;

            // Create a div for the player
            const playerDiv = document.createElement('div');
            playerDiv.id = 'yt-player-' + Date.now();
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(playerDiv);

            // Get current track to initialize with
            const currentTrack = useQueueStore.getState().getCurrentTrack();
            const initialVideoId = currentTrack?.videoId || '';
            currentVideoIdRef.current = initialVideoId;

            const isLocal = initialVideoId.startsWith('blob:') || initialVideoId.startsWith('http://localhost') || initialVideoId.includes('supabase') || initialVideoId.includes('firebase');
            if (isLocal) {
                isLocalTrackRef.current = true;
            }

            if (initialVideoId) {
                setLoading(true);
            }

            const ytInitialVideoId = isLocal ? '' : initialVideoId;

            playerRef.current = new window.YT.Player(playerDiv.id, {
                height: '1',
                width: '1',
                videoId: ytInitialVideoId,
                playerVars: {
                    autoplay: initialVideoId ? 1 : 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event: any) => {
                        console.log('[Player] YouTube player ready');
                        playerReadyRef.current = true;

                        if (isLocalTrackRef.current && currentVideoIdRef.current) {
                            loadVideo(currentVideoIdRef.current);
                        } else {
                            const duration = event.target.getDuration();
                            if (duration > 0) {
                                setDuration(duration);
                            }
                            // Enforce HD Audio if enabled
                            enforceHdAudio();
                        }
                        
                        setLoading(false);

                        // Apply volume
                        event.target.setVolume(isMuted ? 0 : volume * 100);

                        // Start progress tracking
                        startProgressTracking();
                    },
                    onStateChange: (event: any) => {
                        const state = event.data;

                        switch (state) {
                            case window.YT.PlayerState.PLAYING:
                                setIsPlaying(true);
                                setLoading(false);

                                // Track play start time for history
                                if (playStartTimeRef.current === 0) {
                                    playStartTimeRef.current = Date.now();

                                    // Save to history when play starts
                                    const currentTrack = useQueueStore.getState().getCurrentTrack();
                                    if (currentTrack) {
                                        currentTrackRef.current = currentTrack;
                                        savePlayToHistory(currentTrack);
                                    }
                                }

                                // Update duration in case it wasn't available before
                                const duration = event.target.getDuration();
                                if (duration > 0) {
                                    setDuration(duration);
                                }

                                // Re-enforce HD on every play start to prevent degradation
                                enforceHdAudio();
                                break;

                            case window.YT.PlayerState.PAUSED:
                                setIsPlaying(false);
                                break;

                            case window.YT.PlayerState.ENDED:
                                const currentRepeat = useQueueStore.getState().repeatMode;
                                if (currentRepeat === 'one') {
                                    event.target.seekTo(0);
                                    event.target.playVideo();
                                } else {
                                    playNext();
                                }
                                break;

                            case window.YT.PlayerState.BUFFERING:
                                setLoading(true);
                                break;

                            case window.YT.PlayerState.CUED:
                                setLoading(false);
                                break;
                        }
                    },
                    onError: (event: any) => {
                        console.error('[Player] YouTube player error:', event.data);
                        setLoading(false);
                        // Try next track on error after a short delay
                        setTimeout(() => playNext(), 500);
                    },
                },
            });
        };

        initPlayer();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch {
                    // Ignore
                }
                playerRef.current = null;
                playerReadyRef.current = false;
            }
        };
    }, []); // Only run once on mount

    // Subscribe to queue store for track changes - this is the key for instant reactivity!
    useEffect(() => {
        const unsubscribe = useQueueStore.subscribe((state, prevState) => {
            // Get track info directly from state - NOT via getCurrentTrack() function!
            const { queue, currentIndex } = state;
            const { queue: prevQueue, currentIndex: prevIndex } = prevState;

            const newTrack = currentIndex >= 0 && currentIndex < queue.length
                ? queue[currentIndex]
                : null;
            const prevTrack = prevIndex >= 0 && prevIndex < prevQueue.length
                ? prevQueue[prevIndex]
                : null;

            // Check if track actually changed by comparing video IDs
            if (newTrack?.videoId && newTrack.videoId !== prevTrack?.videoId) {
                console.log('[Player] Track changed:', prevTrack?.title, '->', newTrack?.title, 'videoId:', newTrack.videoId);

                if (playerReadyRef.current && playerRef.current) {
                    loadVideo(newTrack.videoId);
                } else {
                    // Player not ready yet, store the video ID for when it's ready
                    console.log('[Player] Player not ready, storing videoId for later');
                    currentVideoIdRef.current = newTrack.videoId;
                }

                // TEMPORARILY DISABLED - Auto-queue causing 400 errors
                // TODO: Fix track data validation before re-enabling
                // setTimeout(() => {
                //     trimOldTracks(); // Keep only last 2 played tracks
                //     autoLoadSongs(); // Load more if running low
                // }, 1000);
            }
        });

        return unsubscribe;
    }, [loadVideo]);


    // Handle play/pause state changes from UI
    useEffect(() => {
        if (isLocalTrackRef.current) {
            if (audioRef.current) {
                if (isPlaying && audioRef.current.paused) {
                    audioRef.current.play().catch((e) => {
                        console.warn('[Player] Audio play blocked:', e);
                        setIsPlaying(false);
                    });
                } else if (!isPlaying && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
            }
            return;
        }

        if (!playerRef.current || !playerReadyRef.current) return;

        try {
            const state = playerRef.current.getPlayerState();
            const ytPlaying = state === window.YT?.PlayerState?.PLAYING;
            const ytBuffering = state === window.YT?.PlayerState?.BUFFERING;

            if (isPlaying && !ytPlaying && !ytBuffering) {
                playerRef.current.playVideo();
            } else if (!isPlaying && (ytPlaying || ytBuffering)) {
                playerRef.current.pauseVideo();
            }
        } catch {
            // Player might be in transition state
        }
    }, [isPlaying]);

    // Handle volume changes
    useEffect(() => {
        const actualVolume = isMuted ? 0 : volume;
        
        if (audioRef.current) {
            audioRef.current.volume = actualVolume;
        }
        
        if (playerRef.current?.setVolume && playerReadyRef.current) {
            try {
                playerRef.current.setVolume(actualVolume * 100);
            } catch {
                // Ignore
            }
        }
    }, [volume, isMuted]);

    // Handle seeking from progress bar
    useEffect(() => {
        const handleSeek = (currentTime: number, prevTime: number) => {
            if (Math.abs(currentTime - prevTime) <= 1.5) return;
            
            if (isLocalTrackRef.current) {
                if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1.5) {
                    audioRef.current.currentTime = currentTime;
                }
                return;
            }

            if (playerRef.current?.seekTo && playerReadyRef.current) {
                try {
                    const ytTime = playerRef.current.getCurrentTime();
                    if (typeof ytTime === 'number' && Math.abs(ytTime - currentTime) > 1.5) {
                        playerRef.current.seekTo(currentTime, true);
                    }
                } catch {
                    // Ignore
                }
            }
        };

        const unsubscribe = usePlayerStore.subscribe((state, prevState) => {
            handleSeek(state.currentTime, prevState.currentTime);
        });

        return unsubscribe;
    }, []);

    // Hidden container for YouTube player and Audio element
    return (
        <>
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            />
            <audio
                ref={audioRef}
                style={{ display: 'none' }}
                onTimeUpdate={(e) => {
                    if (isLocalTrackRef.current) {
                        setCurrentTime(e.currentTarget.currentTime);
                    }
                }}
                onEnded={(e) => {
                    const currentRepeat = useQueueStore.getState().repeatMode;
                    if (currentRepeat === 'one') {
                        e.currentTarget.currentTime = 0;
                        e.currentTarget.play().catch(() => {});
                    } else {
                        playNext();
                    }
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    setLoading(false);
                    // History tracking
                    if (playStartTimeRef.current === 0) {
                        playStartTimeRef.current = Date.now();
                        const currentTrack = useQueueStore.getState().getCurrentTrack();
                        if (currentTrack) {
                            currentTrackRef.current = currentTrack;
                            savePlayToHistory(currentTrack);
                        }
                    }
                }}
                onPause={() => {
                    setIsPlaying(false);
                }}
                onError={(e) => {
                    console.error('[Player] Audio player error:', e);
                    setLoading(false);
                    setTimeout(() => playNext(), 500);
                }}
                onLoadedMetadata={(e) => {
                    const duration = e.currentTarget.duration;
                    if (duration && !isNaN(duration)) {
                        setDuration(duration);
                    }
                }}
                onCanPlay={() => setLoading(false)}
            />
        </>
    );
}
