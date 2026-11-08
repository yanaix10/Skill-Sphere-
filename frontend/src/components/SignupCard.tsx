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

// ==================== Input Component ====================

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

// ==================== BoxReveal Component ====================

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

// ==================== Ripple Component ====================

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
              borderColor: `rgba(13, 148, 136, ${borderOpacity / 100})`,
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

// ==================== OrbitingCircles Component ====================

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
            '--delay': -delay,
          } as React.CSSProperties
        }
        className={cn(
          'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border border-border/40 bg-card/60 [animation-delay:calc(var(--delay)*1000ms)] shadow-sm backdrop-blur-xs',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        {children}
      </section>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================

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

      {/* Center Logo & Brand Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 pointer-events-none select-none text-center px-4">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent p-3.5 border border-primary/30 shadow-2xl backdrop-blur-md flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="SkillSphere Logo"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            SkillSphere
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Real-Time Coding Duels • Quizzes • Skill Arena
          </p>
        </div>
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

// ==================== BottomGradient Component ====================

export const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-xs block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    </>
  );
};

// ==================== Main SignupCard Component ====================

const TECH_ORBIT_ICONS: IconConfig[] = [
  // Inner Orbit: Git Branch
  {
    radius: 140,
    duration: 20,
    delay: 15,
    className: 'size-10 text-emerald-500 border-emerald-500/30',
    component: () => <GitBranch className="w-5 h-5" />,
  },

  // Outer Orbit: Shield Check
  {
    radius: 225,
    duration: 36,
    delay: 27,
    reverse: true,
    className: 'size-11 text-indigo-400 border-indigo-400/30',
    component: () => <ShieldCheck className="w-5.5 h-5.5" />,
  },
];

export const SignupCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setIsLoading(false);
        }
      })
      .catch((error: any) => {
        console.error('Firebase redirect result error:', error);
        handleAuthError(error);
        setIsLoading(false);
      });
  }, []);

  const handleAuthError = (error: any) => {
    const code = error?.code || '';
    const msg = error?.message || 'Authentication failed. Please try again.';

    if (code === 'auth/popup-blocked') {
      setPopupBlocked(true);
      setErrorMessage(
        "Browser blocked the Google popup window. You can click 'Sign In via Redirect' below instead."
      );
    } else if (code === 'auth/cancelled-popup-request') {
      setErrorMessage('Sign-in popup was cancelled due to multiple attempts. Please click once and wait.');
    } else if (code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      setErrorMessage(
        `Domain "${currentHost}" is not authorized in Firebase. Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
      );
    } else if (code === 'auth/popup-closed-by-user') {
      setErrorMessage('Sign-in popup was closed before completing. Click again when ready.');
    } else if (code === 'auth/network-request-failed') {
      setErrorMessage('Network error during authentication. Check your internet connection or ad-blocker.');
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
      console.error('Firebase popup sign-in error:', error);
      handleAuthError(error);

      if (error?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          console.error('Fallback redirect error:', redirectErr);
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
      console.error('Firebase redirect sign-in error:', error);
      handleAuthError(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Column: Tech Orbit Display (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative items-center justify-center border-r border-border/60 bg-gradient-to-br from-card/30 via-background to-secondary/30">
        <TechOrbitDisplay iconsArray={TECH_ORBIT_ICONS} />
      </div>

      {/* Right Column: Google Login & App Bullet Points */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-y-auto">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
          {/* Logo & Heading */}
          <div className="space-y-2">
            <BoxReveal boxColor="var(--primary)" duration={0.3}>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  alt="SkillSphere Logo"
                  className="w-10 h-10 object-contain drop-shadow-sm"
                />
                <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
                  SkillSphere
                </h2>
              </div>
            </BoxReveal>

            <BoxReveal boxColor="var(--primary)" duration={0.3}>
              <p className="text-xs text-muted-foreground font-medium">
                Sign in with your Google account to get started.
              </p>
            </BoxReveal>
          </div>

          {/* 3 Core Highlights in 3 Bullet Point Lines */}
          <BoxReveal boxColor="var(--primary)" duration={0.35} width="100%">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/80 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Platform Highlights
              </span>
              <ul className="space-y-2 list-none p-0 m-0">
                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-xs shadow-primary" />
                  <span className="font-medium">Real-Time Coding Duels</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-xs shadow-primary" />
                  <span className="font-medium">Quizzes</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-xs shadow-primary" />
                  <span className="font-medium">Skill Arena</span>
                </li>
              </ul>
            </div>
          </BoxReveal>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-left text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Authentication Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Single Google Login Option */}
          <BoxReveal boxColor="var(--primary)" duration={0.4} width="100%" overflow="visible">
            <div className="space-y-2.5">
              <button
                onClick={signupWithGooglePopup}
                disabled={isLoading}
                type="button"
                className="group/btn relative w-full h-11 rounded-xl bg-card hover:bg-secondary border border-border/90 text-foreground font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none"
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
                <span>{isLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
                <BottomGradient />
              </button>

              {/* Redirect fallback if popups are blocked */}
              {(popupBlocked || errorMessage) && (
                <button
                  onClick={signupWithGoogleRedirect}
                  disabled={isLoading}
                  type="button"
                  className="flex items-center justify-center gap-2 w-full bg-secondary/70 hover:bg-secondary text-foreground border border-border py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>Sign In via Redirect (No Popup)</span>
                </button>
              )}
            </div>
          </BoxReveal>

          {/* Clean Security Badge */}
          <footer className="pt-2 text-muted-foreground text-[11px] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/80" />
            <span>Protected by Google Firebase Authentication</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SignupCard;
