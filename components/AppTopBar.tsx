"use client";

import { usePathname } from "next/navigation";
import HomeTopBar from "@/components/HomeTopBar";

// The same top bar on every signed-in page. Home renders its own, with search.
export default function AppTopBar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <HomeTopBar />;
}
