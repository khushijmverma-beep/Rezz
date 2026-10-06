import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Rezz</h1>

      <p>Create and manage your resumes in one place.</p>

      <Link className="button-link" href="/templates">Get Started</Link>


      <h2>Build Your Resume</h2>
      <p>
        Choose a template, add your information, and create a professional
        resume.
      </p>
    </main>
  );
}