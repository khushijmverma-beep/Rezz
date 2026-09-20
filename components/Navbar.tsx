import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <Link href="/">Home</Link>
      <Link href="/login">Login</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/resume/demo">Resume Detail</Link>
    </nav>
  );
}
