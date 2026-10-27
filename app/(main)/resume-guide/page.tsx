"use client"

import SectionNav from "@/components/SectionNav";

const h2 = "mt-0! mb-3! text-xl font-semibold text-black!";
const h3 = "mt-0! mb-2! text-base font-semibold text-black!";
const card = "rounded-lg border border-gray-300 bg-white px-5 py-4";
const ul = "list-disc space-y-1.5 pl-5 text-gray-700";

const strongVerbs = [
  "Built", "Led", "Launched", "Reduced", "Increased", "Organized",
  "Trained", "Created", "Improved", "Analyzed", "Designed", "Managed",
];

const examples = [
  {
    before: "Responsible for social media accounts.",
    after: "Grew the club's Instagram from 2,000 to 9,500 followers in six months by posting three times a week and testing short videos.",
  },
  {
    before: "Helped customers with their problems.",
    after: "Resolved 40+ customer calls a day while keeping satisfaction ratings above 95%.",
  },
  {
    before: "Worked on a team project to make an app.",
    after: "Built a budgeting app with a team of four using React; 200 students used it in the first month.",
  },
  {
    before: "Did data entry.",
    after: "Entered and double-checked 300 records a day with under 1% errors, so the weekly report always went out on time.",
  },
];

const sections = [
  { id: "strong-bullets", label: "1. Write strong bullets" },
  { id: "one-page", label: "2. Keep it to one page" },
  { id: "ats-formatting", label: "3. ATS-safe formatting" },
  { id: "keywords", label: "4. Be honest" },
  { id: "how-rezz-scores", label: "How Rezz scores" },
];

export default function ResumeGuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
      <aside className="mb-8 lg:mb-0">
        <div className="lg:sticky lg:top-[92px]">
          <SectionNav sections={sections} />
        </div>
      </aside>

      <div className="space-y-10">
      <header>
        <h1 className="mb-3!">Resume Guide</h1>
        <p className="mb-0! text-lg">
          A quick rundown of general tips for resume building.
        </p>
      </header>

      {/* Bullets */}
      <section id="strong-bullets" className="scroll-mt-20">
        <h2 className={h2}>1. Write strong bullets</h2>
        <p>
          Each bullet should answer three questions: <strong>what did you do</strong>,{" "}
          <strong>how did you do it</strong>, and <strong>what happened because of it</strong>?
        </p>

        <div className={`${card} mb-4`}>
          <p className="mb-0! text-black!">
            <strong>Action verb</strong> + <strong>what you did</strong> + <strong>the result</strong>
          </p>
        </div>

        <h3 className={h3}>Start with a strong verb</h3>
        <p className="mb-2!">Good starters:</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {strongVerbs.map((v) => (
            <span key={v} className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-sm text-black">
              {v}
            </span>
          ))}
        </div>
        <p>
          Don&apos;t use phrases like “responsible for,” “helped with,” and “worked on.”
        </p>

        <h3 className={h3}>Show the result</h3>
        <ul className={ul}>
          <li>Use a number when you honestly have one (do not invent them): how many, how much, how often, and/or how fast.</li>
          <li>Do not overuse numbers; too many can make your resume harder to read.</li>
        </ul>

        <h3 className="mt-6! mb-3! text-base font-semibold text-black!">Before and after</h3>
        <div className="space-y-3">
          {examples.map((ex) => (
            <div key={ex.before} className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3">
                <p className="mb-1! text-xs font-semibold uppercase tracking-wide text-gray-500!">Before</p>
                <p className="mb-0! text-sm text-gray-700!">{ex.before}</p>
              </div>
              <div className="rounded-lg border border-black bg-white px-4 py-3">
                <p className="mb-1! text-xs font-semibold uppercase tracking-wide text-black!">After</p>
                <p className="mb-0! text-sm text-black!">{ex.after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* One page */}
      <section id="one-page" className="scroll-mt-20">
        <h2 className={h2}>2. Keep it to one page when you can</h2>
        <ul className={ul}>
          <li>Give your most recent or most relevant job 3 to 5 bullets, and older ones 1 or 2.</li>
          <li>Trim long bullets to one or two lines.</li>
          <li>Keep the font readable (10 to 12 pt) and the margins reasonable. </li>
        </ul>
      </section>

      <section id="ats-formatting" className="scroll-mt-20">
        <h2 className={h2}>3. Use simple, ATS-safe formatting</h2>
        <p>
          Many employers use an applicant tracking system (ATS), software that reads your resume and
          stores it. A simple layout is easier for software, and for people, to read.
        </p>
        <ul className={ul}>
          <li><strong>Use one column, no more and no less</strong></li>
          <li><strong>Use Standard headings:</strong> Experience, Education, Skills, Projects.</li>
          <li><strong>Avoid using pictures to describe things</strong></li>
          <li><strong>Put contact details in the body,</strong> not in the page header or footer.</li>
          <li><strong>Only use plain fonts</strong> such as Arial or Times New Roman, and simple round bullets.</li>
          <li><strong>Use the same date style</strong> everywhere (for example, Jun 2023 – Aug 2024).</li>
          <li>Save as <strong>PDF</strong> unless the job post asks for Word.</li>
        </ul>
      </section>

      {/* Keywords */}
      <section id="keywords" className="scroll-mt-20">
        <h2 className={h2}>4. Be honest about your resume</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-gray-700">
            <li>It is normal for someone to not have the skills a job asks for.</li>
            <li>Whenever you build your resume, only put things you can genuinely talk about. </li>
            <li>Don&apos;t overstate your skills. Interviewers will ask you to explain anything on your resume.</li>

        </ol>
     
      
      </section>

      {/* Scoring */}
      <section id="how-rezz-scores" className="scroll-mt-20">
        <h2 className={h2}>How Rezz scores your resume</h2>
        <p>
          Rezz gives your resume two scores, because two different readers look at it: software, and a
          person.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={card}>
            <h3 className={h3}>ATS score</h3>
            <p className="text-black!">
              How easily software can read your resume and match it to a job.
            </p>
            <p className="mb-0!">
              It looks at things like whether your sections and contact details can be found, whether the
              layout is simple, and whether the skills in the job post show up in your resume.
            </p>
          </div>
          <div className={card}>
            <h3 className={h3}>Recruiter score</h3>
            <p className="text-black!">
              How convincing your resume is to a person reading it.
            </p>
            <p className="mb-0!">
              It looks at things like whether your bullets show results, whether your most relevant
              experience is easy to find, and whether the writing is clear and concise.
            </p>
          </div>
        </div>

        <h3 className="mt-5! mb-2! text-base font-semibold text-black!">How to use them</h3>
        <ul className={ul}>
          <li><strong>If low ATS score:</strong> fix the layout (section 3) and make sure skills from the job post that you genuinely have appear in your resume.</li>
          <li><strong>If low recruiter score:</strong> rewrite your bullets with verbs and results (section 1).</li>
        </ul>
        <p className="mt-3!">
          Treat the scores as estimated feedback, results on Rezz are not guaranteed to land you an interview.
        </p>
      </section>
      </div>
    </div>
  );
}

