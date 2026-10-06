import AnalyzePanel from "@/components/AnalyzePanel";
import Link from "next/link";
import styles from "./page.module.css";

const resumeText = `Name: Name
Email: Name@example.com

Education
University of Texas at Dallas
Bachelor of Science in Computer Science

Experience
Software Engineering Intern
Worked on software development projects.

Skills
Java, Python, C++, Git`;

export default function ResumeDetailPage() {
  return (
    <div className={styles.resumeView}>
      <aside className={styles.sidebar} aria-label="Resume tools">
        <Link className={styles.dashboardLink} href="/dashboard">
          Dashboard
        </Link>
        <AnalyzePanel resumeText={resumeText} />
      </aside>

      <article className={styles.paper} aria-labelledby="resume-title">
        <header className={styles.resumeHeader}>
          <p className={styles.pageLabel}>Resume Detail</p>
          <h1 id="resume-title">Software Engineer Resume</h1>
          <div className={styles.contactDetails}>
            <p>
              <strong>Name:</strong> Name
            </p>
            <p>
              <strong>Email:</strong> Name@example.com
            </p>
          </div>
        </header>

        <div className={styles.resumeSections}>
          <section className={styles.resumeSection} aria-labelledby="education">
            <h2 id="education">Education</h2>
            <div className={styles.entry}>
              <h3>University of Texas at Dallas</h3>
              <p>Bachelor of Science in Computer Science</p>
            </div>
          </section>

          <section className={styles.resumeSection} aria-labelledby="experience">
            <h2 id="experience">Experience</h2>
            <div className={styles.entry}>
              <h3>Software Engineering Intern</h3>
              <p>Worked on software development projects.</p>
            </div>
          </section>

          <section className={styles.resumeSection} aria-labelledby="skills">
            <h2 id="skills">Skills</h2>
            <div className={styles.entry}>
              <p>Java, Python, C++, Git</p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
