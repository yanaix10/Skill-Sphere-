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

// ==================== Tech Stack Icons ====================

const ReactIcon = () => (
  <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-5 h-5 drop-shadow-xs">
    <title>React</title>
    <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
    <g stroke="#61DAFB" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const TypeScriptIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 rounded-[3px] overflow-hidden drop-shadow-xs">
    <title>TypeScript</title>
    <rect width="32" height="32" fill="#3178C6" />
    <path d="M7 11h9v3.2h-3v11h-3v-11h-3V11zm10.5 4.8c.8-.8 1.8-1.2 3.1-1.2 1.4 0 2.5.4 3.3 1.2.8.8 1.2 1.8 1.2 3.1v.2h-2.9v-.2c0-.5-.1-.9-.4-1.2-.3-.3-.7-.4-1.2-.4s-.9.1-1.2.4c-.3.3-.4.7-.4 1.2 0 .4.1.7.3.9.2.2.6.5 1.3.8l1.4.6c1.1.5 2 1.1 2.6 1.8.6.7.9 1.6.9 2.7 0 1.4-.4 2.5-1.3 3.3-.9.8-2 1.2-3.5 1.2-1.5 0-2.7-.4-3.6-1.3-.9-.9-1.3-2.1-1.3-3.6v-.3h2.9v.3c0 .6.2 1.1.5 1.4.3.3.8.5 1.4.5s1.1-.2 1.4-.5c.3-.3.5-.8.5-1.4 0-.4-.1-.8-.4-1.1-.3-.3-.8-.6-1.5-.9l-1.3-.5c-1-.4-1.8-1-2.4-1.6-.6-.7-.9-1.6-.9-2.7.1-1.3.6-2.4 1.4-3.2z" fill="#FFFFFF" />
  </svg>
);

const NextJsIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-xs">
    <title>Next.js</title>
    <circle cx="16" cy="16" r="15" fill="#000000" stroke="#404040" strokeWidth="1" />
    <path d="M21.5 22.8L12.7 11.2h-1.9v10.9h1.7v-8.8l8 10.4c.3-.3.7-.6 1-.9zm-1.8-11.6h1.7v6.8h-1.7v-6.8z" fill="#FFFFFF" />
  </svg>
);

const NodeIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-xs">
    <title>Node.js</title>
    <path d="M16 2.5L3.5 9.7v14.6L16 31.5l12.5-7.2V9.7L16 2.5zm8.9 19.8l-8.9 5.2-8.9-5.2V11.4l8.9-5.1 8.9 5.1v10.9z" fill="#68A063"/>
    <path d="M16 7.5L8.5 11.8v8.6L16 24.7l7.5-4.3v-8.6L16 7.5z" fill="#339933" opacity="0.4"/>
  </svg>
);

const PythonIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-xs">
    <title>Python</title>
    <path d="M15.9 3c-6.8 0-6.4 3-6.4 3l.01 3.1h6.5v.9H6.9s-4.3-.5-4.3 6.3c0 6.9 3.8 6.6 3.8 6.6h2.3v-3.2s-.1-3.8 3.8-3.8h6.5s3.6.1 3.6-3.6V6.6s.5-3.6-6.7-3.6zm-3.7 2c.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1z" fill="#3776AB"/>
    <path d="M16.1 29c6.8 0 6.4-3 6.4-3l-.01-3.1h-6.5v-.9h9.1s4.3.5 4.3-6.3c0-6.9-3.8-6.6-3.8-6.6h-2.3v3.2s.1 3.8-3.8 3.8h-6.5s-3.6-.1-3.6 3.6v5.7s-.5 3.6 6.7 3.6zm3.7-2c-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1 0 .6-.5 1.1-1.1 1.1z" fill="#FFD438"/>
  </svg>
);

const PostgresIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-xs">
    <title>PostgreSQL</title>
    <circle cx="16" cy="16" r="15" fill="#336791" />
    <path d="M16 6c-4.4 0-8 3.1-8 7.5 0 2.8 1.5 5.3 3.8 6.5v4.2c0 .5.4.8.8.8h1.2c.4 0 .8-.3.8-.8v-3.2h2.8v3.2c0 .5.4.8.8.8h1.2c.4 0 .8-.3.8-.8v-4.2c2.3-1.2 3.8-3.7 3.8-6.5C24 9.1 20.4 6 16 6zm-2.8 9.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm5.6 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#FFFFFF"/>
  </svg>
);

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

      {/* Center Logo in pure sphere form & Brand Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 pointer-events-none select-none text-center px-4">
        <div className="relative flex items-center justify-center">
          {/* Subtle cyan glow aura */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-xl scale-125 pointer-events-none" />
          <img
            src="/logo.svg"
            alt="SkillSphere Sphere"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full shadow-[0_0_35px_rgba(0,242,254,0.4)] relative z-10"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground m-0">
          SkillSphere
        </h1>
      </div>

      {/* Orbiting Tech Stack Icons */}
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
  // Inner Orbit: Frontend Tech Stacks (Radius 135)
  {
    radius: 135,
    duration: 22,
    delay: 0,
    className: 'size-10 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <ReactIcon />,
  },
  {
    radius: 135,
    duration: 22,
    delay: 7.33,
    className: 'size-10 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <TypeScriptIcon />,
  },
  {
    radius: 135,
    duration: 22,
    delay: 14.67,
    className: 'size-10 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <NextJsIcon />,
  },

  // Outer Orbit: Backend Tech Stacks & Database (Radius 215)
  {
    radius: 215,
    duration: 30,
    delay: 0,
    reverse: true,
    className: 'size-11 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <NodeIcon />,
  },
  {
    radius: 215,
    duration: 30,
    delay: 10,
    reverse: true,
    className: 'size-11 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <PythonIcon />,
  },
  {
    radius: 215,
    duration: 30,
    delay: 20,
    reverse: true,
    className: 'size-11 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <PostgresIcon />,
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
