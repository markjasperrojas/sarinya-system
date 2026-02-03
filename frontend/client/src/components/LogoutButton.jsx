import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";
import Button from "./Button";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  return (
    <Button
      variant="danger"
      size="small"
      icon={LogOut}
      onClick={handleLogout}
      title="Logout"
    >
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
