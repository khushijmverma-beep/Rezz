"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import Avatar from "@/components/Avatar";

type ProfileMenuProps = {
  name: string;
  email: string;
  photo: string | null;
};

export default function ProfileMenu({
  name,
  email,
  photo,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await signOut(auth);
    router.push("/");
  }

  async function handleAddAccount() {
    setOpen(false);
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 transition hover:bg-gray-100"
      >
        <Avatar name={name} size={36} src={photo} />
        <ChevronDown size={15} className="text-gray-500" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3">
            <Avatar name={name} size={40} src={photo} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {name}
              </p>
              <p className="truncate text-xs text-gray-500">{email}</p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Settings size={17} />
            View profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleAddAccount}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <UserPlus size={17} />
            Add account
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
