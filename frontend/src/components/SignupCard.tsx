import React from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const SignupCard: React.FC = () => {
    const signupWithGoogle = () => {
        signInWithPopup(auth, googleProvider);
    };

    const handleDevLogin = () => {
        localStorage.setItem('skillsphere_dev_auth', 'true');
        window.location.reload();
    };
    
    return (
        <div className="flex justify-center items-center h-screen w-screen bg-background font-sans text-foreground transition-colors duration-200">
            <div className="bg-card p-10 rounded-2xl shadow-xl w-full max-w-[400px] text-center border border-border">
                <header>
                    <h1 className="text-primary text-[1.8rem] font-extrabold m-0 tracking-[1px]">SKILLSPHERE CODER</h1>
                    <p className="text-muted-foreground text-sm mt-2 font-medium">Learn • Grow • Enjoy</p>
                </header>

                <div className="h-px bg-border my-6"></div>

                <button onClick={signupWithGoogle} className="flex items-center justify-center gap-3 w-full bg-card border border-border text-foreground p-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-secondary hover:shadow-sm">
                    <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google" 
                        className="w-5 h-5"
                    />
                    <span>SignIn with Google</span>
                </button>

                <div className="mt-4 pt-4 border-t border-border">
                    <button
                        onClick={handleDevLogin}
                        className="w-full bg-secondary text-primary border border-primary/40 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                        ⚡ Dev / Guest Login Bypass
                    </button>
                </div>

                <footer className="mt-6 text-muted-foreground text-xs">
                    <p>Join the community of skilled coders.</p>
                </footer>
            </div>
        </div>
    );
};

export default SignupCard;
