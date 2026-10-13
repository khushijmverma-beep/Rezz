import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Rezz",
  description: "Build a resume in your own words with Rezz templates, saved resumes, and AI feedback.",
};

export default function AboutPage() {
  return (
    <main>
      <header className="about-intro">
        <p className="eyebrow">ABOUT REZZ</p>
        <h1>Your experience.<br />Your words. Your next step.</h1>
        <p className="about-lead">Rezz is a resume builder with thoughtful templates, saved resumes, and AI feedback. Bring your experience together, choose a design, and shape a resume that feels like you.</p>
        <Link className="button-link" href="/templates">Explore templates</Link>
      </header>
      <section className="about-section" aria-labelledby="how-it-works">
        <h2 id="how-it-works">How it works</h2>
        <div className="about-grid">
          <div><h3>1. Save your details</h3><p>Add your experience, education, skills, and projects so you can keep your information together.</p></div>
          <div><h3>2. Pick a template</h3><p>Choose a layout and edit your words directly on the resume. Make the design work for your story.</p></div>
          <div><h3>3. Get feedback</h3><p>Review a score and comments on your finished resume, then decide what you want to improve.</p></div>
        </div>
      </section>
      <section className="about-section" aria-labelledby="ai-promise">
        <h2 id="ai-promise">Our AI promise</h2>
        <p>The AI never writes your resume. It only sorts the information you give it into the right fields, and scores and comments on your finished resume. Your words stay your words.</p>
        <p>You choose what to include and which feedback to act on. Review any information sorted by AI before relying on it.</p>
      </section>
      <section className="about-section" aria-labelledby="terms">
        <h2 id="terms">Terms and Conditions</h2>
        <h3>Using Rezz</h3><p>Use Rezz to create and manage your own resumes. You are responsible for the accuracy of your information and for keeping your account secure.</p>
        <h3>Your account and data</h3><p>Your saved resume data is stored in your account and is private to you within Rezz. Other users cannot view it. You retain ownership of the content you provide.</p>
        <h3>Feedback is guidance</h3><p>AI scores and comments can be incomplete or mistaken. They are guidance, not a guarantee of an interview, a job, or any hiring outcome.</p>
        <h3>Acceptable use</h3><p>Do not upload unlawful content, impersonate someone else, access another person’s account, or attempt to disrupt the service. Only include information you have permission to use.</p>
        <h3>Changes to these terms</h3><p>These terms may change as the project develops. Updates will appear on this page; review them before continuing to use the service.</p>
      </section>
      <section className="about-section" aria-labelledby="privacy">
        <h2 id="privacy">A note on privacy</h2>
        <p>Only add personal information you want included in your resume. When you use AI features, the information needed for that request is sent to our AI provider for processing. Avoid including sensitive details such as passwords or government identification numbers.</p>
      </section>
      <section className="about-section" aria-labelledby="project">
        <h2 id="project">Built to learn. Built to help.</h2>
        <p>Rezz is a student project built through GDSC at UT Dallas.</p>
      </section>
    </main>
  );
}
