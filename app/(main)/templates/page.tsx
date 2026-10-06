import Link from "next/link";
export default function TemplatesPage() {
  return (
    <main>
      <h1>Template Selection</h1>

      <p>Choose a resume template.</p>

      <div>
        <h2>Modern Template</h2>
        <p>A clean and simple resume layout.</p>
        <Link href="/resume/demo">
        <button>Select Template</button>
        </Link>
      </div>

      <div>
        <h2>Professional Template</h2>
        <p>A traditional resume layout.</p>
        <Link href="/resume/demo">
        <button>Select Template</button>
        </Link>
      </div>
    </main>
  );
}