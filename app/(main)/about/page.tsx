import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Rezz",
  description: "Learn about Rezz, a resume builder for creating and managing resumes.",
};

export default function AboutPage() {
  return (
    <main>
      <h1>About Rezz</h1>
      {/* Placeholder copy: replace with the team's final project description. */}
      <p>
        Rezz is a resume builder that helps you create and manage your resumes
        in one place.
      </p>
      <h2>Built around your next step</h2>
      <p>
        Start with a template, add your education, experience, and skills, and
        shape a resume that tells your story.
      </p>
      <h2>Our project</h2>
      <p>
        Rezz is being developed as part of a GDSC UTD mentorship sprint.
        We are working toward making resume building simpler and more useful.
      </p>
      <Link className="button-link" href="/templates">Explore templates</Link>
    </main>
  );
}
