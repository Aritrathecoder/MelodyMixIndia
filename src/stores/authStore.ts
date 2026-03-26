import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase/config';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut as firebaseSignOut, 
    onAuthStateChanged, 
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser
} from 'firebase/auth';

// Admin email(s) — only these accounts can access the admin panel
const ADMIN_EMAILS = ['aritrasen893@gmail.com'];

interface AuthState {
    user: User | null;
    userId: string | null;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    isGuest: boolean;
    isAdmin: boolean;
}

interface AuthActions {
    initialize: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
    continueAsGuest: () => void;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const initialState: AuthState = {
    user: null,
    userId: null,
    email: null,
    displayName: null,
    avatarUrl: null,
    isLoading: true,
    isInitialized: false,
    isGuest: false,
    isAdmin: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            initialize: async () => {
                if (get().isInitialized) return;

                set({ isLoading: true });

                try {
                    // Listen for auth state changes
                    onAuthStateChanged(auth, (user) => {
                        if (user) {
                            set({
                                user,
                                userId: user.uid,
                                email: user.email || null,
                                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                                avatarUrl: user.photoURL || null,
                                isLoading: false,
                                isInitialized: true,
                                isAdmin: ADMIN_EMAILS.includes(user.email || ''),
                            });
                        } else {
                            if (!get().isGuest) {
                                set({
                                    user: null,
                                    userId: null,
                                    email: null,
                                    displayName: null,
                                    avatarUrl: null,
                                    isLoading: false,
                                    isInitialized: true,
                                });
                            }
                        }
                    });
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    set({ isLoading: false, isInitialized: true });
                }
            },

            signInWithGoogle: async () => {
                set({ isLoading: true });

                try {
                    const provider = new GoogleAuthProvider();
                    provider.setCustomParameters({
                        prompt: 'select_account'
                    });
                    
                    await signInWithPopup(auth, provider);
                    // State is automatically updated by onAuthStateChanged
                } catch (error) {
                    console.error('Google sign in error:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            signOut: async () => {
                try {
                    // Only sign out from Firebase if not a guest
                    if (!get().isGuest) {
                        await firebaseSignOut(auth);
                    }
                    
                    // Clear all state including guest mode
                    set({
                        user: null,
                        userId: null,
                        email: null,
                        displayName: null,
                        avatarUrl: null,
                        isGuest: false,
                        isLoading: false,
                        isInitialized: true,
                    });
                    
                    // Clear persisted storage for auth
                    localStorage.removeItem('blissmusic-auth');
                    
                    console.log('User signed out successfully');
                } catch (error) {
                    console.error('Sign out error:', error);
                }
            },

            continueAsGuest: () => {
                // Set guest mode with a temporary guest ID
                const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                set({
                    isGuest: true,
                    userId: guestId,
                    email: `${guestId}@guest.melodymixx.in`,
                    displayName: 'Guest User',
                    avatarUrl: null,
                    isLoading: false,
                    isInitialized: true,
                });
            },

            signInWithEmail: async (email: string, pass: string) => {
                await signInWithEmailAndPassword(auth, email, pass);
            },

            signUpWithEmail: async (email: string, pass: string) => {
                await createUserWithEmailAndPassword(auth, email, pass);
            },

            resetPassword: async (email: string) => {
                await sendPasswordResetEmail(auth, email);
            },

            deleteAccount: async () => {
                const currentUser = auth.currentUser;
                if (!currentUser) throw new Error("No user logged in currently");
                
                try {
                    await deleteUser(currentUser);
                    // Reset local store state
                    set({
                        user: null,
                        userId: null,
                        email: null,
                        displayName: null,
                        avatarUrl: null,
                        isGuest: false,
                        isLoading: false,
                        isInitialized: true,
                        isAdmin: false,
                    });
                    localStorage.removeItem('blissmusic-auth');
                } catch (error) {
                    console.error("Error deleting account", error);
                    throw error;
                }
            },

            refreshSession: async () => {
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        // Force refresh token
                        await currentUser.getIdToken(true);
                        set({
                            user: currentUser,
                            userId: currentUser.uid,
                            email: currentUser.email || null,
                            displayName: currentUser.displayName || 'User',
                            avatarUrl: currentUser.photoURL || null,
                        });
                    }
                } catch (error) {
                    console.error('Session refresh error:', error);
                }
            },
        }),
        {
            name: 'blissmusic-auth',
            partialize: (state) => ({
                userId: state.userId,
                email: state.email,
                displayName: state.displayName,
                avatarUrl: state.avatarUrl,
                isGuest: state.isGuest,
            }),
        }
    )
);
