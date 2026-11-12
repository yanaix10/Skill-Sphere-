import React, {
  memo,
  ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
} from 'react';
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { app } from '../firebase';
import {
  Code2,
  Swords,
  Trophy,
  Terminal,
  Cpu,
  GitBranch,
  ShieldCheck,
  AlertCircle,
  Globe,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });


export const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          var(--primary, #0d9488),
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border-none bg-secondary/80 px-3 py-2 text-sm text-foreground transition duration-200 placeholder:text-muted-foreground focus-visible:ring-[2px] focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);
Input.displayName = 'Input';


type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

export const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as
          | 'relative'
          | 'absolute'
          | 'fixed'
          | 'sticky'
          | 'static',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#0d9488',
          borderRadius: 4,
        }}
      />
    </section>
  );
});


type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

export const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 9,
  className = '',
}: RippleProps) {
  return (
    <section
      className={cn(
        'absolute inset-0 flex items-center justify-center pointer-events-none',
        '[mask-image:linear-gradient(to_bottom,black,transparent)] dark:[mask-image:linear-gradient(to_bottom,white,transparent)]',
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(0.04, mainCircleOpacity - i * 0.025);
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';
        const borderOpacity = Math.min(25, 5 + i * 4);

        return (
          <span
            key={i}
            className="absolute animate-ripple rounded-full bg-foreground/5 border"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: '1px',
              borderColor: 'var(--border)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});


type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

export const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-border/60 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <section
        style={
          {
            '--duration': duration,
            '--radius': radius,
            animationDelay: `${-delay}s`,
            animationDuration: `${duration}s`,
            animationDirection: reverse ? 'reverse' : 'normal',
          } as React.CSSProperties
        }
        className={cn(
          'absolute flex transform-gpu animate-orbit items-center justify-center rounded-xl border border-border/60 bg-card/90 shadow-md backdrop-blur-md',
          className
        )}
      >
        {children}
      </section>
    </>
  );
});


// React
const ReactBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="React">
    <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-5.5 h-5.5">
      <circle cx="0" cy="0" r="2.05" fill="#00d8ff" />
      <g stroke="#00d8ff" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  </div>
);

// Docker
const DockerBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Docker">
    <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="#2496ED">
      <path d="M13 8h2v2h-2V8zm-3 0h2v2h-2V8zm-3 0h2v2H7V8zm6-3h2v2h-2V5zm-3 0h2v2h-2V5zm-3 0h2v2H7V5zm15.8 7.2c-.4-.3-1.2-.4-1.9-.2-.3-.5-.7-.9-1.2-1.2l-.6-.4-.4.6c-.3.5-.4 1.1-.3 1.7-.8.5-1.8.6-2.8.5H1.6c-.4 1.3-.3 3.5.7 5.1 1.3 2.1 3.5 3.3 6.7 3.3 5.4 0 9.8-3.3 11.4-8.8.7.2 1.5.1 2.1-.3.4-.3.6-.8.6-.8l-.3-.5z" />
    </svg>
  </div>
);

// Express
const ExpressBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Express.js">
    <span className="font-mono text-sm font-bold tracking-tighter text-foreground select-none">
      ex
    </span>
  </div>
);

// Git
const GitBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Git">
    <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="#F05032">
      <path d="M2.59 13.41l10.82 10.82c.78.78 2.05.78 2.83 0l8.18-8.18c.78-.78.78-2.05 0-2.83L13.6 2.4a2 2 0 0 0-2.83 0L8.35 4.82l3.43 3.43c.48-.15 1.05-.04 1.45.36.4.4.51.97.36 1.45l3.3 3.3c.48-.15 1.05-.04 1.45.36.59.59.59 1.54 0 2.12-.59.59-1.54.59-2.12 0-.42-.42-.52-1.02-.33-1.51l-3.08-3.08v4.51c.15.11.29.25.39.39.59.59.59 1.54 0 2.12-.59.59-1.54.59-2.12 0-.59-.59-.59-1.54 0-2.12.18-.18.39-.3.61-.37v-4.63c-.22-.07-.43-.19-.61-.37-.42-.42-.52-1.02-.33-1.51L7 6.17l-4.41 4.41c-.78.78-.78 2.05 0 2.83z" />
    </svg>
  </div>
);

// TypeScript
const TypeScriptBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="TypeScript">
    <div className="w-5 h-5 rounded-[3px] bg-[#3178C6] flex items-center justify-center shadow-xs">
      <span className="text-[10px] font-black text-white leading-none font-sans tracking-tight">
        TS
      </span>
    </div>
  </div>
);


type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
};

export const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
}: TechnologyOrbitDisplayProps) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background ripple pulses */}
      <Ripple />

      {/* Center Circular Logo (No text, no perimeter glow) */}
      <div className="relative z-10 flex items-center justify-center pointer-events-none select-none">
        <img
          src="/logo.png"
          alt="SkillSphere Logo"
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full relative z-10 drop-shadow-sm"
        />
      </div>

      {/* Orbiting Tech Icons */}
      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});


export const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-xs block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    </>
  );
};


const TECH_ORBIT_ICONS: IconConfig[] = [
  // Inner Orbit (Radius 135): React, TypeScript, Express
  {
    radius: 135,
    duration: 24,
    delay: 0,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <ReactBadge />,
  },
  {
    radius: 135,
    duration: 24,
    delay: 8,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <TypeScriptBadge />,
  },
  {
    radius: 135,
    duration: 24,
    delay: 16,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <ExpressBadge />,
  },

  // Outer Orbit (Radius 215, reverse): Docker, Git
  {
    radius: 215,
    duration: 32,
    delay: 4,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <DockerBadge />,
  },
  {
    radius: 215,
    duration: 32,
    delay: 20,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <GitBadge />,
  },
];

export const SignupCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setIsLoading(false);
      })
      .catch((error: any) => {
        handleAuthError(error);
        setIsLoading(false);
      });
  }, []);

  const handleAuthError = (error: any) => {
    const code = error?.code || '';
    if (code === 'auth/popup-blocked') {
      setPopupBlocked(true);
      setErrorMessage("Popup was blocked. Use the redirect option below.");
    } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      setErrorMessage(null);
    } else if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      setErrorMessage(`Domain "${host}" is not authorized. Add it in Firebase Console → Authentication → Authorized Domains.`);
    } else if (code === 'auth/network-request-failed') {
      setErrorMessage('Network error. Check your internet connection.');
    } else if (error?.message) {
      setErrorMessage(error.message);
    }
  };

  const signIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    setPopupBlocked(false);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      handleAuthError(error);
      if (error?.code === 'auth/popup-blocked') {
        try { await signInWithRedirect(auth, googleProvider); } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInRedirect = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      handleAuthError(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left — Orbit display on desktop */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative items-center justify-center border-r border-border/60 bg-gradient-to-br from-card/30 via-background to-secondary/30">
        <TechOrbitDisplay iconsArray={TECH_ORBIT_ICONS} />
      </div>

      {/* Right — Sign in card */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-6 sm:px-12 relative">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm p-8 sm:p-9 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-6 relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 text-center">
            <img src="/logo.png" alt="SkillSphere" className="w-12 h-12 rounded-full object-contain drop-shadow" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">SkillSphere</h1>
              <p className="text-xs text-muted-foreground mt-1">Sign in to continue</p>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign in button */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={signIn}
              disabled={isLoading}
              type="button"
              className="relative w-full h-11 rounded-xl bg-card hover:bg-secondary border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              )}
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            {(popupBlocked || errorMessage) && (
              <button
                onClick={signInRedirect}
                disabled={isLoading}
                type="button"
                className="w-full h-9 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground border border-border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                Sign in via Redirect
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/70">
            <a href="/privacy" className="hover:text-foreground transition-colors no-underline">Privacy</a>
            <span>·</span>
            <a href="/terms" className="hover:text-foreground transition-colors no-underline">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupCard;
