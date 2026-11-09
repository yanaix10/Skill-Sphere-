import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Calendar,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  Users,
  Lock,
  Layers,
  Terminal,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google sign in popup error:", err);
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/cancelled-popup-request") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error("Google sign in redirect error:", redirectErr);
          setErrorMessage(redirectErr?.message || "Sign in failed. Please try again.");
        }
      } else {
        setErrorMessage(err?.message || "Authentication failed. Please verify network connection or popup permissions.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background text-foreground font-sans scroll-smooth">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card/40 via-background to-background py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Learning & Academic Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Level up your skills with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
              real-time duels
            </span>{" "}
            and organized study.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            SkillSphere is an all-in-one platform featuring 1v1 multi-language coding duels,
            interactive skill quizzes, developer activity metrics, and seamless Google Classroom & Calendar sync.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
              )}
              <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <Link
              to="/quizzes"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm border border-border flex items-center justify-center gap-2 transition-all no-underline"
            >
              <span>Explore Quizzes as Guest</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>

          {errorMessage && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-card border border-border/80">
              <div className="text-xs text-muted-foreground font-medium">Coding Duels</div>
              <div className="text-xl font-bold text-foreground mt-0.5">1v1 Real-Time</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/80">
              <div className="text-xs text-muted-foreground font-medium">Supported Languages</div>
              <div className="text-xl font-bold text-foreground mt-0.5">Python, C++, JS</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/80">
              <div className="text-xs text-muted-foreground font-medium">Google Integrations</div>
              <div className="text-xl font-bold text-foreground mt-0.5">Classroom + Cal</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/80">
              <div className="text-xs text-muted-foreground font-medium">Data Privacy</div>
              <div className="text-xl font-bold text-foreground mt-0.5">Read-Only Scopes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Designed for developers and computer science students
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect your coursework, test your algorithmic speed, and maintain an active coding streak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Duels */}
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">1v1 Real-Time Coding Duels</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Match with peers in timed coding battles. Write code in Python, C++, Java, or JavaScript
              with automated evaluation against sample and hidden test suites.
            </p>
            <ul className="text-xs space-y-2 text-foreground/90 list-none p-0 m-0 pt-2 border-t border-border/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Synchronized test execution</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Multi-language starter templates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Spectator and live status updates</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Quizzes */}
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Interactive Skill Quizzes</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Test your knowledge across algorithms, data structures, web technologies, and systems engineering.
              Instant explanations help reinforce key concepts.
            </p>
            <ul className="text-xs space-y-2 text-foreground/90 list-none p-0 m-0 pt-2 border-t border-border/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Multiple categories & difficulty tiers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Immediate answer verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>No login required for guest practice</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Academic Sync */}
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Academic & Calendar Sync</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connect Google Classroom and Google Calendar to see your coursework, upcoming homework deadlines,
              and study sessions unified right alongside your coding goals.
            </p>
            <ul className="text-xs space-y-2 text-foreground/90 list-none p-0 m-0 pt-2 border-t border-border/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Filtered view of pending coursework</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Today's scheduled meetings at a glance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Independent login & logout for each service</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Google Services Compliance & Verification Section */}
      <section className="py-16 px-4 sm:px-8 bg-secondary/30 border-y border-border/70">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2.5 text-primary font-mono text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Google API Services Compliance & User Data Protection</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Transparent, read-only access to academic tools
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            SkillSphere integrates with Google services exclusively to assist students with deadline management.
            We request minimal, read-only permissions and never access private personal messages or files.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Google Calendar (calendar.events.readonly)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Read-only access is used strictly to display your upcoming study meetings, classes, and deadlines
                inside the unified overview schedule. SkillSphere does not modify or delete events.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Google Classroom (courses & coursework readonly)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Read-only access is used solely to list enrolled courses and pending assignments with due dates.
                SkillSphere does not submit grades or alter coursework.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/80 border border-border/80 text-xs text-foreground/90 space-y-2">
            <p className="font-semibold text-foreground">
              Google API Services User Data Policy / Limited Use Compliance:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              SkillSphere's use and transfer to any other app of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                <span>Google API Services User Data Policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              , including the Limited Use requirements. SkillSphere does not sell Google user data, share it with third-party brokers,
              or use it to train artificial intelligence or machine learning models.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Experience / Quick Start Banner */}
      <section className="py-16 px-4 sm:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ready to test your programming skills?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Sign in with your Google account to track your match ratings, or explore practice quizzes directly as a guest.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Sign In with Google</span>
          </button>
          <Link
            to="/quizzes"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-xs sm:text-sm border border-border hover:bg-secondary/80 transition-all no-underline"
          >
            Practice Quizzes
          </Link>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-8 bg-card/40 text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SkillSphere" className="w-5 h-5 rounded-full object-contain" />
            <span className="font-semibold text-foreground">SkillSphere</span>
            <span>&bull; Developer Learning Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/quizzes" className="hover:text-foreground transition-colors no-underline">
              Quizzes & Duels
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors no-underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors no-underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

