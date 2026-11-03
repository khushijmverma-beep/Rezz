"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HomeTopBar from "@/components/HomeTopBar";
import Logo from "@/components/Logo";

// The element the resume editor renders its title and actions into (via a portal),
// so they share one row with the logo. Only the editor route has this slot.
let slotElement: HTMLElement | null = null;
const listeners = new Set<() => void>();

function setSlot(element: HTMLElement | null) {
  slotElement = element;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTopBarSlot(): HTMLElement | null {
  return useSyncExternalStore(subscribe, () => slotElement, () => null);
}

const isEditorRoute = (pathname: string) => /^\/resume\/[^/]+$/.test(pathname);

// The same top bar on every signed-in page. Home renders its own, with search.
export default function AppTopBar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  if (!isEditorRoute(pathname)) return <HomeTopBar />;

  // Same size and spacing as HomeTopBar, but logo mark only plus the editor's slot.
  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Room for the sidebar's fixed hamburger button, which sits on top of this bar. */}
      <div className="w-10 shrink-0" aria-hidden="true" />

      <Link href="/" aria-label="Go to Home" className="flex shrink-0 items-center">
        <Logo size={28} showText={false} className="text-gray-900" />
      </Link>

      <div ref={setSlot} className="flex h-full min-w-0 flex-1 items-center" />
    </header>
  );
}
