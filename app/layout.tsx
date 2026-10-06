import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rezz",
  description: "Resume builder",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
