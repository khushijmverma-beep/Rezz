"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Search, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getPhoto } from "@/lib/profilePhoto";
import Logo from "@/components/Logo";
import ProfileMenu from "@/components/ProfileMenu";

type HomeTopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export default function HomeTopBar({
  search,
  onSearchChange,
}: HomeTopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  // Saved photo, tagged with the user it belongs to so a stale one is never shown.
  const [savedPhoto, setSavedPhoto] = useState<{ uid: string; photo: string | null } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    let cancelled = false;

    getPhoto(uid)
      .then((photo) => {
        if (!cancelled) setSavedPhoto({ uid, photo });
      })
      .catch(() => {
        if (!cancelled) setSavedPhoto({ uid, photo: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const name = user?.displayName || user?.email?.split("@")[0] || "Account";
  const photo = savedPhoto && savedPhoto.uid === user?.uid ? savedPhoto.photo : null;
  const avatarSrc = photo ?? user?.photoURL ?? null;

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 flex h-[68px] items-center gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="w-10 shrink-0" aria-hidden="true" />

      <Logo size={28} className="shrink-0 text-gray-900" />

      <div className="mx-auto flex w-full max-w-xl items-center">
        <label className="flex h-10 w-full items-center gap-3 rounded-full bg-gray-100 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-300">
          <Search size={18} className="shrink-0 text-gray-500" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search resumes"
            aria-label="Search resumes by title"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="rounded-full p-1 text-gray-500 hover:bg-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </label>
      </div>

      {user && (
        <div className="shrink-0">
          <ProfileMenu name={name} email={user.email ?? ""} photo={avatarSrc} />
        </div>
      )}
    </header>
  );
}
