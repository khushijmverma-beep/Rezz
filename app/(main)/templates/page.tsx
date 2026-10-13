import Link from "next/link";
import { templates } from "@/lib/templates";

export default function TemplatesPage() {
  return (
    <main>
      <h1>Template Selection</h1>

      <p>Choose a resume template.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article className="surface-card" key={template.id}>
            <h2>{template.name}</h2>
            <Link className="button-link" href={`/resume/new?template=${template.id}`}>
              Select Template
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}