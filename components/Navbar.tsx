import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link href="/">Home</Link>
      <Link href="/login">Login</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/resume/demo">Resume Detail</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/about">About</Link>
    </nav>
  );
}
