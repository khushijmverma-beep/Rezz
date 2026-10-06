import Navbar from "@/components/Navbar";
import ProfileSidebar from "@/components/ProfileSidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProfileSidebar />
      <Navbar />
      <div className="site-content">{children}</div>
    </>
  );
}
