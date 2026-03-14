import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import FeedbackButton from "../FeedbackButton";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />
      <main className="md:pl-64">{children}</main>
      <FeedbackButton />
    </div>
  );
}
