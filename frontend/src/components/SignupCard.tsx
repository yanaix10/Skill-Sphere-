import React, { useState, useEffect } from 'react';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult 
} from 'firebase/auth';
import { app } from '../firebase';
import { AlertCircle, Globe, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const SignupCard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [popupBlocked, setPopupBlocked] = useState(false);

    useEffect(() => {
        // Handle redirect result if user was redirected for Google login
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    // Login successful via redirect
                    setIsLoading(false);
                }
            })
            .catch((error: any) => {
                console.error("Firebase redirect result error:", error);
                handleAuthError(error);
                setIsLoading(false);
            });
    }, []);

    const handleAuthError = (error: any) => {
        const code = error?.code || '';
        const msg = error?.message || 'Authentication failed. Please try again.';

        if (code === 'auth/popup-blocked') {
            setPopupBlocked(true);
            setErrorMessage("Browser blocked the Google popup window. You can click 'Sign In with Redirect' below instead.");
        } else if (code === 'auth/cancelled-popup-request') {
            setErrorMessage("Sign-in popup was cancelled due to multiple attempts. Please click once and wait.");
        } else if (code === 'auth/unauthorized-domain') {
            const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
            setErrorMessage(
                `Domain "${currentHost}" is not authorized in Firebase. Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
            );
        } else if (code === 'auth/popup-closed-by-user') {
            setErrorMessage("Sign-in popup was closed before completing. Click again when ready.");
        } else if (code === 'auth/network-request-failed') {
            setErrorMessage("Network error during authentication. Check your internet connection or ad-blocker.");
        } else {
            setErrorMessage(msg);
        }
    };

    const signupWithGooglePopup = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setErrorMessage(null);
        setPopupBlocked(false);

        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Firebase popup sign-in error:", error);
            handleAuthError(error);

            // If popup was blocked, automatically attempt redirect as graceful fallback
            if (error?.code === 'auth/popup-blocked') {
                try {
                    await signInWithRedirect(auth, googleProvider);
                } catch (redirectErr: any) {
                    console.error("Fallback redirect error:", redirectErr);
                    handleAuthError(redirectErr);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signupWithGoogleRedirect = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setErrorMessage(null);

        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            console.error("Firebase redirect sign-in error:", error);
            handleAuthError(error);
            setIsLoading(false);
        }
    };

    const handleDevLogin = () => {
        localStorage.setItem('skillsphere_dev_auth', 'true');
        window.location.reload();
    };

    return (
        <div className="flex justify-center items-center min-h-screen w-screen bg-background font-sans text-foreground transition-colors duration-200 p-4">
            <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-[420px] text-center border border-border relative overflow-hidden backdrop-blur-sm">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <header className="relative z-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3 shadow-inner">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h1 className="text-primary text-[1.8rem] font-extrabold m-0 tracking-[1px]">
                        SKILLSPHERE
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 font-medium">
                        Real-Time Coding Duels • Quizzes • Skill Arena
                    </p>
                </header>

                <div className="h-px bg-border my-6"></div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-left text-xs leading-relaxed flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block mb-0.5">Authentication Notice</span>
                            <span>{errorMessage}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3 relative z-10">
                    {/* Primary Google Login Button */}
                    <button 
                        onClick={signupWithGooglePopup} 
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 w-full bg-card hover:bg-secondary border border-border text-foreground p-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                            <img 
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                alt="Google" 
                                className="w-5 h-5"
                            />
                        )}
                        <span>{isLoading ? "Signing In..." : "Continue with Google"}</span>
                    </button>

                    {/* Redirect Fallback Option (useful if popups are blocked by browser) */}
                    {(popupBlocked || errorMessage) && (
                        <button
                            onClick={signupWithGoogleRedirect}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 w-full bg-secondary/60 hover:bg-secondary text-foreground border border-border/80 py-2.5 px-4 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                            <Globe className="w-4 h-4 text-primary" />
                            <span>Sign In via Redirect (No Popup)</span>
                        </button>
                    )}
                </div>

                <div className="my-5 flex items-center gap-3 text-muted-foreground text-xs">
                    <div className="h-px bg-border flex-1" />
                    <span>OR</span>
                    <div className="h-px bg-border flex-1" />
                </div>

                {/* Instant Dev / Guest Bypass */}
                <div className="relative z-10">
                    <button
                        onClick={handleDevLogin}
                        className="w-full group bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:from-primary/20 hover:to-primary/20 text-primary border border-primary/30 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/60"
                    >
                        <span>⚡ Instant Guest / Dev Bypass</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-[11px] text-muted-foreground mt-2">
                        Enter immediately without Google login credentials.
                    </p>
                </div>

                <footer className="mt-6 pt-4 border-t border-border/60 text-muted-foreground text-[11px] flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>Protected by Firebase Authentication</span>
                </footer>
            </div>
        </div>
    );
};

export default SignupCard;
