import React from "react";
import { Shield, Lock, FileText, CheckCircle2 } from "lucide-react";

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>LEGAL & COMPLIANCE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Last Updated: November 9, 2026 &bull; Effective Immediately
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          1. Overview
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          Welcome to <strong>SkillSphere</strong> (accessible at https://xskillsphere.vercel.app). 
          We respect your privacy and are committed to protecting personal data. This Privacy Policy outlines 
          how SkillSphere handles information when you use our platform, including our integrations with 
          Google Calendar and Google Classroom.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          2. Information We Collect Through Google APIs
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          When you choose to connect your Google account with SkillSphere via OAuth 2.0, we request read-only access to:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/90 pl-2">
          <li>
            <strong>Google Calendar Events (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">calendar.events.readonly</code>):</strong> 
            To view upcoming scheduled meetings, classes, and deadlines directly in your dashboard calendar.
          </li>
          <li>
            <strong>Google Classroom Courses (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">classroom.courses.readonly</code>):</strong> 
            To list the courses and subjects you are currently enrolled in.
          </li>
          <li>
            <strong>Google Classroom Coursework (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">classroom.coursework.me.readonly</code>):</strong> 
            To list your pending assignments, deadlines, point values, and submission requirements.
          </li>
        </ul>
      </section>

      <section className="space-y-3 p-4 rounded-xl bg-secondary/60 border border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
          <CheckCircle2 className="w-5 h-5" />
          3. Google API Limited Use Disclosure
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          SkillSphere's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline font-semibold"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p className="text-sm leading-relaxed text-foreground/90">
          We strictly do not use Google user data for advertising, nor do we sell or transfer Google data to third parties. 
          All access tokens are stored securely and used solely to present your personalized schedule and course assignments within your authenticated dashboard.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Data Storage & Security</h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          We employ industry-standard encryption protocols and secure HTTPS connections for all data in transit. 
          OAuth access tokens and refresh tokens are encrypted at rest. You can disconnect your Google account at any time 
          directly from the SkillSphere Dashboard settings or via your Google Account Permissions page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Contact Us</h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          If you have questions about this Privacy Policy or your data, please contact us at:{" "}
          <a href="mailto:naitik.yadav641@gmail.com" className="text-primary font-bold">
            naitik.yadav641@gmail.com
          </a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
