import type { ResumeData } from "@/lib/types/resume";

/** Fictional content for template screenshots; never used to populate a user's resume. */
export const sampleResume: ResumeData = {
  name: "Avery Rowan",
  email: "avery.rowan@example.com",
  phone: "(214) 555-0186",
  location: "Dallas, Texas",
  website: "averyrowan.example.com",
  summary: "Software developer who turns complex workflows into thoughtful, accessible tools. Experienced in building web applications, collaborating across disciplines, and making everyday tasks simpler.",
  experience: [
    { id: "experience-1", title: "Software Engineering Intern", company: "Juniper Studio", location: "Dallas, TX", dates: "May 2026 – August 2026", bullets: ["Built a React dashboard that brought project updates into one searchable workspace.", "Partnered with designers to improve keyboard navigation across 12 core screens.", "Added integration tests for the team's most-used reporting workflows."] },
    { id: "experience-2", title: "Student Web Developer", company: "Campus Digital Lab", location: "Richardson, TX", dates: "September 2025 – April 2026", bullets: ["Created a reusable event registration interface for six student organizations.", "Documented shared components and helped onboard three new contributors."] },
  ],
  education: [{ id: "education-1", school: "The University of Texas at Dallas", degree: "B.S. in Computer Science", dates: "Expected May 2027", details: "Coursework: Data Structures, Database Systems, Human–Computer Interaction" }],
  skills: ["TypeScript", "React", "Python", "SQL", "Git", "Accessibility", "Figma"],
  projects: [{ id: "project-1", name: "Gather / Community events", url: "gather.example.com", description: "Designed and built a shared calendar that helps student groups discover events and coordinate volunteers. Created responsive views and searchable event filters." }],
  awards: ["Dean’s List · 2025–2026", "Campus Design Challenge · Finalist"],
};
