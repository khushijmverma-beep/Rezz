"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Search, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getPhoto } from "@/lib/profilePhoto";

type HomeTopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export default function HomeTopBar({
  search,
  onSearchChange,
}: HomeTopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setPhoto(null);
      return;
    }

    let cancelled = false;

    getPhoto(user.uid)
      .then((savedPhoto) => {
        if (!cancelled) setPhoto(savedPhoto);
      })
      .catch(() => {
        if (!cancelled) setPhoto(null);
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
  const avatarSrc = photo ?? user?.photoURL ?? null;

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 flex h-[68px] items-center gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="w-10 shrink-0" aria-hidden="true" />

      <span className="shrink-0 text-lg font-bold tracking-tight text-gray-900">
        REZZ
      </span>

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
        <div className="shrink-0" aria-label={`Signed in as ${name}`}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={`${name}'s profile`}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
