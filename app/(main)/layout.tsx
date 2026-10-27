import AppTopBar from "@/components/AppTopBar";
import AuthGate from "@/components/AuthGate";
import ProfileSidebar from "@/components/ProfileSidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ProfileSidebar />
      <AppTopBar />
      <div className="site-content">{children}</div>
    </AuthGate>
  );
}
