"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Home, FileText, Activity, BookOpen, Info, LogOut } from "lucide-react";
import { app } from "@/lib/firebase";
import { getPhoto } from "@/lib/profilePhoto";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";

// change these hrefs if your routes are named differently
const NAV = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/resume-details", label: "Resume Details", Icon: FileText },
  { href: "/activity", label: "Activity", Icon: Activity },
  { href: "/resume-guide", label: "Resume Guide", Icon: BookOpen },
  { href: "/about", label: "About", Icon: Info },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => onAuthStateChanged(getAuth(app), setUser), []);

  // each time the panel opens, load the saved photo
  const uid = user?.uid;
  useEffect(() => {
    if (!open || !uid) return;
    let cancelled = false;
    getPhoto(uid)
      .then((p) => { if (!cancelled) setPhoto(p); })
      .catch((e) => console.error(e)); // fall back to Google photo or initials
    return () => { cancelled = true; };
  }, [open, uid]);

  // signed out: clear the cached photo
  useEffect(() => {
    if (!uid) setPhoto(null);
  }, [uid]);

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
  const avatarSrc = photo ?? user.photoURL ?? null;

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
        <Link href="/dashboard" onClick={() => setOpen(false)} className="mb-5 block text-black!">
          <Logo size={28} />
        </Link>
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className={`mb-4 flex items-center gap-3 rounded-lg p-2 transition-colors ${
            isActive("/settings") ? "bg-gray-300" : "hover:bg-gray-200"
          }`}
        >
          <Avatar name={name} size={48} src={avatarSrc} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black!">{name}</p>
            <p className="truncate text-xs text-gray-600!">{user.email}</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={tabClass(href)}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-200"
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