import Avatar from "@/components/Avatar";
import type { ResumeData } from "@/lib/resumeDetails";

const card = "rounded-lg border border-gray-200 bg-white px-5 pb-7";
const headerCard = "rounded-lg border border-gray-200 bg-white p-5";

function Empty() {
  return <p className="text-sm text-gray-400">Not added yet</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ResumeDetailsView({
  data,
  onEdit,
}: {
  data: ResumeData;
  onEdit: () => void;
}) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github, data.website].filter(Boolean);
  const range = (startDate: string, endDate: string) =>
    startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate;

  return (
    <div className="space-y-3">
      <section className={headerCard}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={name} size={72} />
            <div className="min-w-0">
              <h1 className="wrap-break-word text-2xl font-semibold leading-snug">{name || "Your name"}</h1>
              {contact.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-gray-600">
                  {contact.map((c) => <span key={c}>{c}</span>)}
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-400">No contact details yet</p>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </section>

      <Section title="About">
        {data.summary ? <p className="whitespace-pre-line text-sm text-gray-700">{data.summary}</p> : <Empty />}
      </Section>

      <Section title="Experience">
        {data.experience.length ? (
          <div className="space-y-4">
            {data.experience.map((e, i) => (
              <div key={i}>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-gray-700">{e.company}</p>
                {e.location && <p className="text-sm text-gray-700">{e.location}</p>}
                {range(e.startDate, e.endDate) && <p className="text-xs text-gray-500">{range(e.startDate, e.endDate)}</p>}
                {e.bullets.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-700">
                    {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Section>

      <Section title="Education">
        {data.education.length ? (
          <div className="space-y-4">
            {data.education.map((e, i) => (
              <div key={i}>
                <p className="font-semibold">{e.school}</p>
                <p className="text-sm text-gray-700">{e.field ? `${e.degree} in ${e.field}` : e.degree}</p>
                {range(e.startDate, e.endDate) && <p className="text-xs text-gray-500">{range(e.startDate, e.endDate)}</p>}
                {e.gpa && <p className="text-xs text-gray-500">GPA: {e.gpa}</p>}
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Section>

      <Section title="Skills">
        {data.skills.length ? (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span key={s} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{s}</span>
            ))}
          </div>
        ) : <Empty />}
      </Section>

      {(["certifications", "languages"] as const).map((key) => (
        <Section key={key} title={key === "certifications" ? "Certifications" : "Languages"}>
          {data[key]?.length ? <p className="text-sm text-gray-700">{data[key]?.join(", ")}</p> : <Empty />}
        </Section>
      ))}

      <Section title="Projects">
        {data.projects.length ? (
          <div className="space-y-4">
            {data.projects.map((p, i) => (
              <div key={i}>
                <p className="font-semibold">{p.name}</p>
                {p.link && <p className="text-sm text-blue-600">{p.link}</p>}
                {p.description && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{p.description}</p>}
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Section>

      <Section title="Awards">
        {data.awards.length ? (
          <div className="flex flex-wrap gap-2">
            {data.awards.map((a) => (
              <span key={a} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{a}</span>
            ))}
          </div>
        ) : <Empty />}
      </Section>
    </div>
  );
}