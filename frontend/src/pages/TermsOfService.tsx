import React from "react";
import { FileCheck, ShieldAlert, Award, Scale } from "lucide-react";

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold font-mono">
          <Scale className="w-3.5 h-3.5" />
          <span>USER AGREEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Last Updated: November 9, 2026 &bull; Effective Immediately
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          1. Acceptance of Terms
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          By accessing or using <strong>SkillSphere</strong> (the "Service") at https://xskillsphere.vercel.app, 
          you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          2. Platform Purpose & Account Use
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          SkillSphere provides coding duel arenas, quizzes, peer ranking, academic schedule sync, and classroom assignment management for developers and students. 
          You are responsible for safeguarding your login credentials and for all activities that occur under your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          3. Third-Party Integrations (Google Calendar & Classroom)
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          SkillSphere integrates with third-party services including Google Calendar and Google Classroom to aggregate your academic timetable and homework assignments. 
          By connecting your Google account, you grant SkillSphere read-only permission to retrieve your upcoming events and coursework. 
          You may revoke this integration at any time through your SkillSphere account dashboard or directly through your Google account security settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Prohibited Conduct</h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/90 pl-2">
          <li>Cheat, tamper with code execution runtimes, or submit unauthorized automated solutions during duels.</li>
          <li>Interfere with or disrupt the integrity or security of our networks and servers.</li>
          <li>Attempt to reverse-engineer, exploit, or bypass authentication controls.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Termination & Modifications</h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          We reserve the right to modify or terminate the Service or your access to the Service at any time for conduct that violates these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. Contact</h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          For inquiries regarding these Terms of Service, please reach out to:{" "}
          <a href="mailto:naitik.yadav641@gmail.com" className="text-primary font-bold">
            naitik.yadav641@gmail.com
          </a>.
        </p>
      </section>
    </div>
  );
};

export default TermsOfService;
