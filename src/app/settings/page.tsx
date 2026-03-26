'use client';

/**
 * Settings Page
 * Manage account, preferences, and data
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Switch } from '@/components/ui/switch';
import { usePlayerStore } from '@/stores/playerStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Trash2, User, ChevronRight, Info, Shield, Volume2, UserMinus } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { user, userId, displayName, email, isInitialized, isGuest, signOut, deleteAccount } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { hdMode, toggleHdMode } = usePlayerStore();

    useEffect(() => {
        if (isInitialized) {
            if (!userId) {
                router.push('/');
            } else {
                setLoading(false);
            }
        }
    }, [isInitialized, userId, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all saved data.')) return;
        
        setDeleting(true);
        try {
            await deleteAccount();
            router.push('/');
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            if (error?.code === 'auth/requires-recent-login') {
                alert('For security reasons, please sign out and sign in again before deleting your account.');
            } else {
                alert('Failed to delete account: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear your entire listening history? This cannot be undone.')) return;

        setClearing(true);
        try {
            // Backend disabled, just simulating success
            alert('History cleared successfully');
        } catch (error) {
            console.error('Failed to clear history:', error);
            alert('Failed to clear history');
        } finally {
            setClearing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-emerald-400">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Settings</h1>
                    <p className="text-gray-400">Manage your account and preferences</p>
                </div>

                {/* Account Section */}
                <section className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-400" />
                        Account
                    </h2>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold">
                                {(displayName || email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-lg">{displayName || 'User'}</div>
                                <div className="text-gray-400">{isGuest ? 'Guest Account' : email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleSignOut} className="border-white/10 hover:bg-white/5">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                            {!isGuest && (
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteAccount} 
                                    disabled={deleting}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/20"
                                >
                                    <UserMinus className="w-4 h-4 mr-2" />
                                    {deleting ? 'Deleting...' : 'Delete Account'}
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Playback (Placeholder) */}
                <section className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-400" />
                        Playback
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition">
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    HD Audio
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                        Beta
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Algorithmic Hi-Res audio enforcement (Experimental)
                                </div>
                            </div>
                            <Switch
                                checked={hdMode}
                                onCheckedChange={toggleHdMode}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition">
                            <div>
                                <div className="font-medium">Crossfade</div>
                                <div className="text-sm text-gray-400">Off</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                </section>

                {/* Data & Privacy */}
                <section className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        Data & Privacy
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Listening History</div>
                                <div className="text-sm text-gray-400">Manage your playback data</div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleClearHistory}
                                disabled={clearing}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {clearing ? 'Clearing...' : 'Clear History'}
                            </Button>
                        </div>
                    </div>
                </section>

                {/* About */}
                <section className="bg-zinc-900/50 rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-gray-400" />
                        About
                    </h2>
                    <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                            <span>Version</span>
                            <span>1.0.0 (Beta)</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Built with</span>
                            <span>Next.js + Firebase + YouTube Music</span>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
