import ProfileSidebar from "@/components/ProfileSidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProfileSidebar />
      <div className="site-content">{children}</div>
    </>
  );
}
