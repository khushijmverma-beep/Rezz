import Link from "next/link";
import ResumeDraftList from "@/components/ResumeDraftList";

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>

      <p>Welcome back!</p>

      <h2>Your Resumes</h2>
      <ResumeDraftList />

      <Link className="button-link" href="/templates">Create New Resume</Link>
    </main>
  );
}
