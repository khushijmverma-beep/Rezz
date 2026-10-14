"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Home, FileText, Info, LogOut, Activity } from "lucide-react";
import { app } from "@/lib/firebase";
import Avatar from "@/components/Avatar";

// change these hrefs if your routes are named differently
const NAV = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/resume-details", label: "Resume Details", Icon: FileText },
  { href: "/about", label: "About", Icon: Info },
  { href: "/activity", label: "Activity", Icon: Activity}
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => onAuthStateChanged(getAuth(app), setUser), []);

  const handleLogout = async () => {
    await signOut(getAuth(app));
    setOpen(false);
    router.push("/"); // landing page
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const tabClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
      isActive(href) ? "bg-black text-white!" : "text-gray-800! hover:bg-gray-200"
    }`;

  // logged out: no sidebar and no hamburger
  if (!user) return null;

  const name = user.displayName || user.email?.split("@")[0] || "";

  return (
    <div>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-transparent transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-40 flex h-full w-72 flex-col bg-gray-100 p-4 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <p className="mb-5 text-3xl font-bold">Rezz</p>
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={name} size={48} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-gray-600">{user.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={tabClass(href)}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-sm text-black hover:bg-gray-200"
        >
          <LogOut size={18} /> Log out
        </button>
      </aside>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sidebar"
        aria-label="Toggle menu"
        className="fixed top-3 left-3 z-20 flex cursor-pointer flex-col gap-1.5 rounded-full bg-transparent p-3"
      >
        <span className="block h-0.5 w-7 rounded bg-black" />
        <span className="block h-0.5 w-7 rounded bg-black" />
        <span className="block h-0.5 w-7 rounded bg-black" />
      </button>
    </div>
  );
}