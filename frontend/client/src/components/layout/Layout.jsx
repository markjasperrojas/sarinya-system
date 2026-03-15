import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import InstallPrompt from "../InstallPrompt";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />
      <main className="md:pl-64">{children}</main>
      <InstallPrompt />
    </div>
  );
}
