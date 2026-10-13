import type { ResumeData } from "@/lib/types/resume";

/** Fictional content for template screenshots; never used to populate a user's resume. */
export const sampleResume: ResumeData = {
  firstName: "Avery",
  lastName: "Rowan",
  email: "avery.rowan@example.com",
  phone: "(214) 555-0186",
  location: "Dallas, Texas",
  linkedin: "",
  github: "",
  website: "averyrowan.example.com",
  summary:
    "Software developer who turns complex workflows into thoughtful, accessible tools. Experienced in building web applications, collaborating across disciplines, and making everyday tasks simpler. Coursework: Data Structures, Database Systems, Human–Computer Interaction.",
  experience: [
    {
      title: "Software Engineering Intern",
      company: "Juniper Studio",
      location: "Dallas, TX",
      startDate: "May 2026",
      endDate: "August 2026",
      bullets: [
        "Built a React dashboard that brought project updates into one searchable workspace.",
        "Partnered with designers to improve keyboard navigation across 12 core screens.",
        "Added integration tests for the team's most-used reporting workflows.",
      ],
    },
    {
      title: "Student Web Developer",
      company: "Campus Digital Lab",
      location: "Richardson, TX",
      startDate: "September 2025",
      endDate: "April 2026",
      bullets: [
        "Created a reusable event registration interface for six student organizations.",
        "Documented shared components and helped onboard three new contributors.",
      ],
    },
  ],
  education: [
    {
      school: "The University of Texas at Dallas",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "",
      endDate: "Expected May 2027",
      gpa: "",
    },
  ],
  skills: ["TypeScript", "React", "Python", "SQL", "Git", "Accessibility", "Figma"],
  projects: [
    {
      name: "Gather / Community events",
      link: "gather.example.com",
      description:
        "Designed and built a shared calendar that helps student groups discover events and coordinate volunteers. Created responsive views and searchable event filters.",
    },
  ],
  awards: ["Dean’s List · 2025–2026", "Campus Design Challenge · Finalist"],
};
