import Link from "next/link";
export default function DashboardPage() {
   return (
    <main>
      <h1>Dashboard</h1>

      <p>Welcome back!</p>

      <h2>Your Resumes</h2>

      <div>
        <h3>Software Engineer Resume</h3>
        <p>Last updated: September 26, 2026</p>
        <Link href="/resume/demo">
        <button>View Resume</button>
        </Link>
      </div>

      <div>
        <h3>Internship Resume</h3>
        <p>Last updated: September 20, 2026</p>
        <Link href="/resume/demo">
        <button>View Resume</button>
        </Link>
      </div>

      <Link href="/templates">
      <button>Create New Resume</button>
      </Link>
    </main>
  );
}
