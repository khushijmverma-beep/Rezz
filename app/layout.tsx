import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ProfileSidebar from "@/components/ProfileSidebar"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "Rezz",
  description: "Resume builder",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ProfileSidebar />
        <Navbar />
        <main style={{ padding: "1rem" }}>{children}</main>
      </body>
    </html>
  );
}
