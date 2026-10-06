import Link from "next/link";
export default function DashboardPage() {
   return (
    <main>
      <h1>Dashboard</h1>

      <p>Welcome back!</p>

      <h2>Your Resumes</h2>

      <div className="surface-card resume-summary">
        <h3>Software Engineer Resume</h3>
        <p>Last updated: September 26, 2026</p>
        <Link className="button-link" href="/resume/demo">View Resume</Link>
      </div>

      <div className="surface-card resume-summary">
        <h3>Internship Resume</h3>
        <p>Last updated: September 20, 2026</p>
        <Link className="button-link" href="/resume/demo">View Resume</Link>
      </div>

      <Link className="button-link" href="/templates">Create New Resume</Link>
    </main>
  );
}
