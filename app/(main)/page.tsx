import Link from "next/link";
import TemplateCard from "@/components/TemplateCard";
import ResumeCard from "@/components/ResumeCard";

export default function Home() {
  return (
    <main>
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Resume Builder
        </p>

        <h1 className="text-5xl font-bold tracking-tight">
          Build a resume that represents you.
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-gray-600">
          Create and manage your resumes in one place with Rezz.
        </p>

        <div className="mt-8">
          <Link
            href="/templates"
            className="inline-flex rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Choose a Template</h2>

          <p className="mt-2 text-gray-600">
            Start with a template and customize it to fit your experience.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <TemplateCard
            name="Modern"
            thumbnail="Modern Template"
            templateId="modern"
          />

          <TemplateCard
            name="Professional"
            thumbnail="Professional Template"
            templateId="professional"
          />

          <TemplateCard
            name="Simple"
            thumbnail="Simple Template"
            templateId="simple"
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Recent Resumes</h2>

          <p className="mt-2 text-gray-600">
            Quickly access your recently edited resumes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumeCard
            name="Software Engineer Resume"
            updatedAt="Sep 26, 2026"
            resumeId="software-engineer"
          />

          <ResumeCard
            name="Internship Resume"
            updatedAt="Sep 20, 2026"
            resumeId="internship"
          />

          <ResumeCard
            name="UTD CS Resume"
            updatedAt="Sep 15, 2026"
            resumeId="utd-cs"
          />
        </div>
      </section>
    </main>
  );
}
