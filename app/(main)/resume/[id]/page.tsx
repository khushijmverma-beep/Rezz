import Link from "next/link";
export default function ResumeDetailPage() {
  return (
    <main>
      <h1>Resume Detail</h1>

      <h2>Software Engineer Resume</h2>

      <p><strong>Name:</strong> Name</p>
      <p><strong>Email:</strong> Name@example.com</p>

      <h3>Education</h3>
      <p>University of Texas at Dallas</p>
      <p>Bachelor of Science in Computer Science</p>

      <h3>Experience</h3>
      <p>Software Engineering Intern</p>
      <p>Worked on software development projects.</p>

      <h3>Skills</h3>
      <p>Java, Python, C++, Git</p>

      <Link className="button-link" href="/dashboard">Edit Resume</Link>
    </main>
  );
}