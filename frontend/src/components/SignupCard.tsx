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

// ==================== Tech Stack Icons (From Portfolio Categories) ====================

// Frontend: React
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

// Frontend: Tailwind CSS
const TailwindBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Tailwind CSS">
    <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="#38bdf8">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
    </svg>
  </div>
);

// Backend: Express
const ExpressBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Express.js">
    <span className="font-mono text-sm font-bold tracking-tighter text-foreground select-none">
      ex
    </span>
  </div>
);

// Backend: Node.js
const NodeBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Node.js">
    <svg viewBox="0 0 32 32" className="w-5.5 h-5.5">
      <path
        d="M16 2.5L3.5 9.7v14.6L16 31.5l12.5-7.2V9.7L16 2.5z"
        fill="none"
        stroke="#68A063"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#68A063"
        fontSize="12"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        JS
      </text>
    </svg>
  </div>
);

// Database: MongoDB
const MongoBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="MongoDB">
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2C12 2 6 7.5 6 13.5C6 17.5 8.7 20.8 12 22C15.3 20.8 18 17.5 18 13.5C18 7.5 12 2 12 2Z"
        fill="#13AA52"
      />
      <path
        d="M12 2V22C12.3 22 12.6 21.9 12.8 21.8C15.8 20.5 18 17.3 18 13.5C18 7.5 12 2 12 2Z"
        fill="#00ED64"
        opacity="0.65"
      />
      <path d="M12 22V13" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
    </svg>
  </div>
);

// Database: PostgreSQL
const PostgresBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="PostgreSQL">
    <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="#336791">
      <path d="M12 3c-4.4 0-8 3.1-8 7.5 0 2.8 1.5 5.3 3.8 6.5v4c0 .5.4 1 1 1h1c.5 0 1-.5 1-1v-3h2v3c0 .5.5 1 1 1h1c.5 0 1-.5 1-1v-4c2.3-1.2 3.8-3.7 3.8-6.5C20 6.1 16.4 3 12 3zm-2.8 9.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm5.6 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
    </svg>
  </div>
);

// DevOps: Docker
const DockerBadge = () => (
  <div className="w-full h-full flex items-center justify-center" title="Docker">
    <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="#2496ED">
      <path d="M13 8h2v2h-2V8zm-3 0h2v2h-2V8zm-3 0h2v2H7V8zm6-3h2v2h-2V5zm-3 0h2v2h-2V5zm-3 0h2v2H7V5zm15.8 7.2c-.4-.3-1.2-.4-1.9-.2-.3-.5-.7-.9-1.2-1.2l-.6-.4-.4.6c-.3.5-.4 1.1-.3 1.7-.8.5-1.8.6-2.8.5H1.6c-.4 1.3-.3 3.5.7 5.1 1.3 2.1 3.5 3.3 6.7 3.3 5.4 0 9.8-3.3 11.4-8.8.7.2 1.5.1 2.1-.3.4-.3.6-.8.6-.8l-.3-.5z" />
    </svg>
  </div>
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
            src="/sphere-logo.png"
            alt="SkillSphere Sphere"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full shadow-[0_0_35px_rgba(0,242,254,0.4)] relative z-10"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground m-0">
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
  // Inner Orbit: Frontend Stacks (Radius 135)
  {
    radius: 135,
    duration: 22,
    delay: 0,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <ReactBadge />,
  },
  {
    radius: 135,
    duration: 22,
    delay: 7.33,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <TailwindBadge />,
  },
  {
    radius: 135,
    duration: 22,
    delay: 14.67,
    className: 'size-10 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2 backdrop-blur-md',
    component: () => <ExpressBadge />,
  },

  // Outer Orbit: Backend, Database & DevOps (Radius 215)
  {
    radius: 215,
    duration: 32,
    delay: 0,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <NodeBadge />,
  },
  {
    radius: 215,
    duration: 32,
    delay: 8,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <MongoBadge />,
  },
  {
    radius: 215,
    duration: 32,
    delay: 16,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <PostgresBadge />,
  },
  {
    radius: 215,
    duration: 32,
    delay: 24,
    reverse: true,
    className: 'size-11 rounded-xl bg-card/90 border border-border shadow-md flex items-center justify-center p-2.5 backdrop-blur-md',
    component: () => <DockerBadge />,
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
                  src="/sphere-logo.png"
                  alt="SkillSphere Logo"
                  className="w-10 h-10 object-contain drop-shadow-sm rounded-full"
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
